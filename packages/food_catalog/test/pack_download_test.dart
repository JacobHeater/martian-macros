import 'dart:async';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';
import 'package:test/test.dart';

final _url = Uri.parse('https://packs.example.test/barcode_us.pack.gz');

/// A real pack (the fixture), gzip-compressed the way the host serves it.
({List<int> gz, PackListing listing}) fixtureDownload({
  String packId = 'barcode_us',
  String version = '2026-10-09',
  String? sha,
  int? bytes,
}) {
  final dir = Directory.systemTemp.createTempSync('fixture_pack');
  addTearDown(() => dir.deleteSync(recursive: true));
  final path = '${dir.path}/p.pack';
  const FoodPackWriter().write(
    path,
    FoodPackHeader(
      packId: packId,
      formatVersion: FoodPackFormat.version,
      builtOn: version,
      region: 'US',
      sources: const ['test'],
      license: 'test',
      attribution: 'test',
    ),
    FixturePack.entries,
  );
  final gz = gzip.encode(File(path).readAsBytesSync());
  return (
    gz: gz,
    listing: PackListing(
      id: 'barcode_us',
      title: 'Barcode foods, United States',
      version: version,
      formatVersion: FoodPackFormat.version,
      url: _url,
      downloadBytes: bytes ?? gz.length,
      sha256: sha ?? sha256.convert(gz).toString(),
    ),
  );
}

void main() {
  late Directory dir;
  late PackStore store;

  setUp(() {
    dir = Directory.systemTemp.createTempSync('packstore');
    store = PackStore(Directory('${dir.path}/food_packs'));
    addTearDown(() => dir.deleteSync(recursive: true));
  });

  PackDownload start(PackListing listing, InMemoryPackHttp http) =>
      PackDownload.start(listing: listing, http: http, store: store);

  test('a download is installed and the pack opens', () async {
    final d = fixtureDownload();
    final http = InMemoryPackHttp({_url: d.gz}, chunkSize: 256);
    final download = start(d.listing, http);
    final phases = <PackDownloadPhase>[];
    download.progress.listen((p) => phases.add(p.phase));
    await download.done;

    final installed = store.installed('barcode_us')!;
    expect(installed.version, '2026-10-09');
    final pack = SqliteFoodPack.open(installed.path);
    addTearDown(pack.close);
    expect(pack.search('banana'), isNotEmpty);
    expect(phases.first, PackDownloadPhase.downloading);
    expect(
      phases,
      containsAllInOrder([
        PackDownloadPhase.downloading,
        PackDownloadPhase.checking,
        PackDownloadPhase.installing,
      ]),
    );
    expect(store.partialFile('barcode_us', '2026-10-09').existsSync(), isFalse);
  });

  test('progress counts bytes up to the total', () async {
    final d = fixtureDownload();
    final http = InMemoryPackHttp({_url: d.gz}, chunkSize: 256);
    final download = start(d.listing, http);
    final seen = <int>[];
    download.progress.listen((p) {
      if (p.phase == PackDownloadPhase.downloading) seen.add(p.receivedBytes);
    });
    await download.done;
    expect(seen.last, d.gz.length);
    expect(seen, orderedEquals([...seen]..sort()));
    expect(seen.length, greaterThan(5));
  });

  test(
    'a download that loses its connection resumes where it stopped',
    () async {
      final d = fixtureDownload();
      final http = InMemoryPackHttp({_url: d.gz}, chunkSize: 256)
        ..dropAfterBytes = d.gz.length ~/ 2;

      final first = start(d.listing, http);
      await expectLater(
        first.done,
        throwsA(
          isA<PackDownloadFailed>().having(
            (e) => e.problem,
            'problem',
            PackDownloadProblem.connection,
          ),
        ),
      );
      final kept = store.partialBytes('barcode_us', '2026-10-09');
      expect(kept, d.gz.length ~/ 2, reason: 'what arrived is kept');

      final second = start(d.listing, http);
      await second.done;
      expect(
        http.requests.last.rangeStart,
        kept,
        reason: 'it asked for the rest',
      );
      expect(store.installed('barcode_us'), isNotNull);
    },
  );

  test('a server that ignores the range restarts cleanly', () async {
    final d = fixtureDownload();
    final http = InMemoryPackHttp({_url: d.gz}, chunkSize: 256)
      ..dropAfterBytes = 1000
      ..supportsRange = false;
    await expectLater(
      start(d.listing, http).done,
      throwsA(isA<PackDownloadFailed>()),
    );
    await start(d.listing, http).done;
    expect(store.installed('barcode_us'), isNotNull);
  });

  test(
    'a wrong checksum is discarded and the old pack keeps working',
    () async {
      final good = fixtureDownload(version: 'old');
      await start(good.listing, InMemoryPackHttp({_url: good.gz})).done;
      expect(store.installed('barcode_us')!.version, 'old');

      final bad = fixtureDownload(version: 'new', sha: 'a' * 64);
      final download = start(bad.listing, InMemoryPackHttp({_url: bad.gz}));
      await expectLater(
        download.done,
        throwsA(
          isA<PackDownloadFailed>().having(
            (e) => e.problem,
            'problem',
            PackDownloadProblem.checksumMismatch,
          ),
        ),
      );
      expect(store.partialFile('barcode_us', 'new').existsSync(), isFalse);
      final installed = store.installed('barcode_us')!;
      expect(installed.version, 'old');
      final pack = SqliteFoodPack.open(installed.path);
      addTearDown(pack.close);
      expect(pack.search('banana'), isNotEmpty);
    },
  );

  test(
    'cancelling stops at once, keeps the partial file and the old pack',
    () async {
      final good = fixtureDownload(version: 'old');
      await start(good.listing, InMemoryPackHttp({_url: good.gz})).done;

      final d = fixtureDownload(version: 'new');
      final http = InMemoryPackHttp({_url: d.gz}, chunkSize: 256)
        ..stallAfterBytes = d.gz.length ~/ 4;
      final download = start(d.listing, http);
      final stalledAt = d.gz.length ~/ 4;
      final bytes = Completer<void>();
      download.progress.listen((p) {
        if (p.receivedBytes >= stalledAt && !bytes.isCompleted) {
          bytes.complete();
        }
      });
      await bytes.future;
      download.cancel();
      await expectLater(download.done, throwsA(isA<PackDownloadCancelled>()));
      expect(store.partialBytes('barcode_us', 'new'), stalledAt);
      expect(store.installed('barcode_us')!.version, 'old');
    },
  );

  test('cancelled downloads can be started again and finish', () async {
    final d = fixtureDownload();
    final http = InMemoryPackHttp({_url: d.gz}, chunkSize: 256)
      ..stallAfterBytes = d.gz.length ~/ 4;
    final first = start(d.listing, http);
    final stalledAt = d.gz.length ~/ 4;
    final seen = Completer<void>();
    first.progress.listen((p) {
      if (p.receivedBytes >= stalledAt && !seen.isCompleted) seen.complete();
    });
    await seen.future;
    first.cancel();
    await expectLater(first.done, throwsA(isA<PackDownloadCancelled>()));
    await start(d.listing, http).done;
    expect(http.requests.last.rangeStart, stalledAt);
    expect(store.installed('barcode_us'), isNotNull);
  });

  test(
    'an error status from the host is reported and nothing is installed',
    () async {
      final d = fixtureDownload();
      final http = InMemoryPackHttp({_url: d.gz})..failWithStatus = 503;
      await expectLater(
        start(d.listing, http).done,
        throwsA(
          isA<PackDownloadFailed>().having(
            (e) => e.problem,
            'problem',
            PackDownloadProblem.serverError,
          ),
        ),
      );
      expect(store.installed('barcode_us'), isNull);
    },
  );

  test('a pack with the wrong id or an unknown format is refused', () async {
    final wrongId = fixtureDownload(packId: 'something_else');
    await expectLater(
      start(wrongId.listing, InMemoryPackHttp({_url: wrongId.gz})).done,
      throwsA(
        isA<PackDownloadFailed>().having(
          (e) => e.problem,
          'problem',
          PackDownloadProblem.unreadablePack,
        ),
      ),
    );
    expect(store.installed('barcode_us'), isNull);

    final notAPack = gzip.encode(List.filled(5000, 7));
    final listing = PackListing(
      id: 'barcode_us',
      title: 't',
      version: 'x',
      formatVersion: 1,
      url: _url,
      downloadBytes: notAPack.length,
      sha256: sha256.convert(notAPack).toString(),
    );
    await expectLater(
      start(listing, InMemoryPackHttp({_url: notAPack})).done,
      throwsA(isA<PackDownloadFailed>()),
    );
    expect(store.installed('barcode_us'), isNull);
  });

  test(
    'removing a pack deletes it and what was left from downloading it',
    () async {
      final d = fixtureDownload();
      await start(d.listing, InMemoryPackHttp({_url: d.gz})).done;
      store.partialFile('barcode_us', 'later').writeAsBytesSync([1, 2, 3]);
      store.remove('barcode_us');
      expect(store.installed('barcode_us'), isNull);
      expect(store.partialBytes('barcode_us', 'later'), 0);
    },
  );

  group('manifest', () {
    const sha =
        '0000000000000000000000000000000000000000000000000000000000000000';
    String json({String url = 'https://x.test/p.gz', String hash = sha}) => '''
{"packs":[{"id":"barcode_us","title":"Barcode foods","version":"2026-10-09",
"formatVersion":1,"url":"$url","bytes":48000000,"sha256":"$hash"}]}''';

    test('parses a listing', () {
      final m = PackManifest.parse(json());
      expect(m.pack('barcode_us')!.downloadBytes, 48000000);
      expect(m.pack('barcode_us')!.gzip, isTrue);
      expect(m.pack('nope'), isNull);
    });

    test('refuses anything that is not plain https with a real checksum', () {
      expect(
        () => PackManifest.parse(json(url: 'http://x.test/p.gz')),
        throwsFormatException,
      );
      expect(
        () => PackManifest.parse(json(hash: 'abc')),
        throwsFormatException,
      );
      expect(() => PackManifest.parse('{"nope":1}'), throwsFormatException);
      expect(() => PackManifest.parse('[]'), throwsFormatException);
    });
  });
}
