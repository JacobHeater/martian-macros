import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food_packs/food_pack_providers.dart';
import 'package:martian_macros/src/food_packs/pack_download_status.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

/// MM-56: the download controller on a real file system and a pretend network.
void main() {
  final url = Uri.parse('https://packs.example.test/barcode_us.pack.gz');
  late Directory dir;
  late PackStore store;
  late InMemoryPackHttp http;
  late PackListing listing;
  late ProviderContainer container;

  setUp(() {
    dir = Directory.systemTemp.createTempSync('app_packs');
    store = PackStore(Directory('${dir.path}/food_packs'));
    final packFile = '${dir.path}/p.pack';
    const FoodPackWriter().write(
      packFile,
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
    final gz = gzip.encode(File(packFile).readAsBytesSync());
    http = InMemoryPackHttp({url: gz}, chunkSize: 256);
    listing = PackListing(
      id: 'barcode_us',
      title: 'Barcode foods, United States',
      version: '2026-10-09',
      formatVersion: FoodPackFormat.version,
      url: url,
      downloadBytes: gz.length,
      sha256: sha256.convert(gz).toString(),
    );
    container = ProviderContainer(
      overrides: [
        packStoreProvider.overrideWith((ref) => store),
        packHttpProvider.overrideWithValue(http),
      ],
    );
    addTearDown(() {
      container.dispose();
      dir.deleteSync(recursive: true);
    });
  });

  PackDownloadStatus status() =>
      container.read(packDownloadControllerProvider).status;

  test('nothing is fetched until a download is started', () async {
    container.read(packDownloadControllerProvider);
    await Future<void>.delayed(const Duration(milliseconds: 50));
    expect(http.requests, isEmpty);
    expect(status(), PackDownloadStatus.idle);
  });

  test(
    'a started download finishes and the pack is listed as installed',
    () async {
      final controller = container.read(
        packDownloadControllerProvider.notifier,
      );
      await controller.start(listing);
      expect(status(), PackDownloadStatus.done);
      final installed = await container.read(installedPacksProvider.future);
      expect(installed.single.id, 'barcode_us');
      expect(installed.single.version, '2026-10-09');
    },
  );

  test('cancel stops it, keeps what arrived, and resume finishes it', () async {
    http.stallAfterBytes = listing.downloadBytes ~/ 3;
    final controller = container.read(packDownloadControllerProvider.notifier);
    final running = controller.start(listing);
    // Wait until some bytes have arrived.
    while (container.read(packDownloadControllerProvider).receivedBytes <
        listing.downloadBytes ~/ 3) {
      await Future<void>.delayed(const Duration(milliseconds: 5));
    }
    expect(status(), PackDownloadStatus.running);
    controller.cancel();
    await running;
    final paused = container.read(packDownloadControllerProvider);
    expect(paused.status, PackDownloadStatus.paused);
    expect(paused.keptBytes, listing.downloadBytes ~/ 3);

    await controller.start(listing);
    expect(status(), PackDownloadStatus.done);
    expect(http.requests.last.rangeStart, listing.downloadBytes ~/ 3);
  });

  test('discard throws away what was kept', () async {
    http.stallAfterBytes = 512;
    final controller = container.read(packDownloadControllerProvider.notifier);
    final running = controller.start(listing);
    while (container.read(packDownloadControllerProvider).receivedBytes < 512) {
      await Future<void>.delayed(const Duration(milliseconds: 5));
    }
    controller.cancel();
    await running;
    await controller.discard();
    expect(status(), PackDownloadStatus.idle);
    expect(store.partialBytes('barcode_us', '2026-10-09'), 0);
  });

  test('a dropped connection is a failure that keeps what arrived', () async {
    http.dropAfterBytes = 1024;
    final controller = container.read(packDownloadControllerProvider.notifier);
    await controller.start(listing);
    final state = container.read(packDownloadControllerProvider);
    expect(state.status, PackDownloadStatus.failed);
    expect(state.problem, PackDownloadProblem.connection);
    expect(state.keptBytes, 1024);
    await controller.start(listing);
    expect(status(), PackDownloadStatus.done);
  });

  test('a manifest check reads the list once and only when asked', () async {
    final manifestUrl = Uri.parse('https://packs.example.test/manifest.json');
    http.files[manifestUrl] =
        ('{"packs":[{"id":"barcode_us","title":"Barcode foods","version":"v1",'
                '"formatVersion":1,"url":"https://packs.example.test/p.gz",'
                '"bytes":10,"sha256":"${'a' * 64}"}]}')
            .codeUnits;
    final local = ProviderContainer(
      overrides: [
        packHttpProvider.overrideWithValue(http),
        packManifestUrlProvider.overrideWithValue(manifestUrl.toString()),
      ],
    );
    addTearDown(local.dispose);
    local.read(packManifestProvider);
    expect(http.requests, isEmpty);
    await local.read(packManifestProvider.notifier).check();
    expect(http.requests.single.url, manifestUrl);
    expect(
      local.read(packManifestProvider).manifest!.packs.single.id,
      'barcode_us',
    );
  });

  test(
    'an unreadable list or an unreachable host is reported, not thrown',
    () async {
      final manifestUrl = Uri.parse('https://packs.example.test/manifest.json');
      http.files[manifestUrl] = 'not json'.codeUnits;
      final local = ProviderContainer(
        overrides: [
          packHttpProvider.overrideWithValue(http),
          packManifestUrlProvider.overrideWithValue(manifestUrl.toString()),
        ],
      );
      addTearDown(local.dispose);
      await local.read(packManifestProvider.notifier).check();
      expect(local.read(packManifestProvider).message, isNotNull);
      expect(local.read(packManifestProvider).manifest, isNull);
    },
  );
}
