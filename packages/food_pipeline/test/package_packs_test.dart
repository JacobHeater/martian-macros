import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';
import 'package:mm_food_pipeline/mm_food_pipeline.dart';
import 'package:test/test.dart';

void main() {
  late Directory dir;
  final base = Uri.parse('https://packs.example.test/food/');

  setUp(() {
    dir = Directory.systemTemp.createTempSync('publish');
    addTearDown(() => dir.deleteSync(recursive: true));
    Directory('${dir.path}/packs').createSync();
    const FoodPackWriter().write(
      '${dir.path}/packs/barcode_us.pack',
      const FoodPackHeader(
        packId: 'barcode_us',
        formatVersion: FoodPackFormat.version,
        builtOn: '2026-10-09',
        region: 'US',
        sources: ['test'],
        license: 'test',
        attribution: 'test',
      ),
      FixturePack.entries,
    );
  });

  void run() => packagePacks(
    packs: Directory('${dir.path}/packs'),
    out: Directory('${dir.path}/publish'),
    baseUrl: base,
  );

  test('the manifest describes each compressed file exactly', () {
    run();
    final manifest = PackManifest.parse(
      File('${dir.path}/publish/manifest.json').readAsStringSync(),
    );
    final listing = manifest.pack('barcode_us')!;
    final file = File('${dir.path}/publish/barcode_us-2026-10-09.pack.gz');
    expect(listing.url, base.resolve('barcode_us-2026-10-09.pack.gz'));
    expect(listing.downloadBytes, file.lengthSync());
    expect(listing.sha256, sha256.convert(file.readAsBytesSync()).toString());
    expect(listing.title, 'Barcode foods, United States');
    expect(listing.version, '2026-10-09');
  });

  test('packaging the same pack twice gives the same bytes', () {
    run();
    final first = File('${dir.path}/publish/barcode_us-2026-10-09.pack.gz')
        .readAsBytesSync();
    Directory('${dir.path}/publish').deleteSync(recursive: true);
    run();
    expect(
      File('${dir.path}/publish/barcode_us-2026-10-09.pack.gz')
          .readAsBytesSync(),
      first,
    );
  });

  test(
    'a published pack downloads and installs through the app code',
    () async {
      run();
      final manifest = PackManifest.parse(
        File('${dir.path}/publish/manifest.json').readAsStringSync(),
      );
      final listing = manifest.pack('barcode_us')!;
      final http = InMemoryPackHttp({
        listing.url: File('${dir.path}/publish/barcode_us-2026-10-09.pack.gz')
            .readAsBytesSync(),
      });
      final store = PackStore(Directory('${dir.path}/phone'));
      await PackDownload.start(listing: listing, http: http, store: store).done;
      final pack = SqliteFoodPack.open(store.installed('barcode_us')!.path);
      addTearDown(pack.close);
      expect(pack.search('banana'), isNotEmpty);
    },
  );

  test('a manifest base that is not https is refused', () {
    expect(
      () => packagePacks(
        packs: Directory('${dir.path}/packs'),
        out: Directory('${dir.path}/publish'),
        baseUrl: Uri.parse('http://insecure.example.test/'),
      ),
      throwsArgumentError,
    );
  });
}
