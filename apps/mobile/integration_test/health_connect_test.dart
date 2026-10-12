import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:martian_macros/src/health/health_connect_source.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';
import 'package:mm_health_ingest/mm_health_ingest_testing.dart';

/// MM-68, on a device: Health Connect held to the suite every health
/// source has to pass (MM-67), and an import run through it twice.
///
/// It reads whatever the app has been permitted to read and writes
/// nothing. It prints how many readings there are and never their values.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  healthSourceContract(
    'Health Connect on this device',
    () async => HealthConnectSource(),
  );

  testWidgets('what is available and permitted on this device', (_) async {
    final source = HealthConnectSource();
    final available = await source.available();
    final permitted = await source.permitted();
    // ignore: avoid_print
    print('HC available: ${[for (final t in available) t.name]..sort()}');
    // ignore: avoid_print
    print('HC permitted: ${[for (final t in permitted) t.name]..sort()}');
    expect(available, isNotEmpty, reason: 'Health Connect is on this device');
  });

  testWidgets('importing twice does not duplicate', (_) async {
    final source = HealthConnectSource();
    final store = InMemoryHealthSampleStore();
    final importer = HealthImporter(source: source, store: store);
    for (final type in await source.permitted()) {
      final first = await importer.import(type);
      final count = (await store.samples(type)).length;
      final again = await importer.import(type);
      // ignore: avoid_print
      print(
        'HC import ${type.name}: ${first.status.name}, $count readings from '
        '${{for (final s in await store.samples(type)) s.sourceName}.length} '
        'sources; again: ${again.status.name}, +${again.upserted} '
        '-${again.deleted}',
      );
      expect(first.status, HealthImportStatus.updated);
      expect(again.status, HealthImportStatus.updated);
      expect((await store.samples(type)).length, count);
    }
  });
}
