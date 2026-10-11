import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/health/health_importer_provider.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:martian_macros/src/repository_providers.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';
import 'package:mm_health_ingest/mm_health_ingest_testing.dart';

import 'support/in_memory_overrides.dart';

/// MM-67: the app's providers put a health source and the store together,
/// with no phone.
void main() {
  test('importing through the providers fills the store once, and erasing '
      'empties it', () async {
    final repos = InMemoryRepositories();
    final source = FakeHealthSource.fromJson(recordedHealthHistory);
    await source.permit();
    final container = ProviderContainer(
      overrides: [
        ...inMemoryOverrides(repos),
        healthSourceProvider.overrideWithValue(source),
      ],
    );
    addTearDown(container.dispose);

    final importer = container.read(healthImporterProvider);
    await importer.import(HealthDataType.weight);
    await importer.import(HealthDataType.weight);

    final store = container.read(healthSampleStoreProvider);
    expect(await store.samples(HealthDataType.weight), hasLength(5));
    // Nothing imported becomes a typed weigh-in.
    expect(await repos.weights.watchWeights().first, isEmpty);

    await container.read(dataEraserProvider).eraseAll();
    expect(await store.samples(HealthDataType.weight), isEmpty);
    expect(await store.token(HealthDataType.weight), isNull);
  });

  test('with no platform registered, the source says so', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    expect(() => container.read(healthSourceProvider), throwsA(anything));
  });
}
