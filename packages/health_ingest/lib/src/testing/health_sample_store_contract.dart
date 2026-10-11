import 'package:test/test.dart';

import '../health_data_type.dart';
import '../health_sample.dart';
import '../health_sample_store.dart';

/// What every [HealthSampleStore] must do (MM-67).
void healthSampleStoreContract(
  String name,
  HealthSampleStore Function() create,
) {
  group('$name as a HealthSampleStore', () {
    late HealthSampleStore store;

    HealthSample weight(
      String id,
      double kg, {
      int day = 1,
      String source = 'scale',
    }) => HealthSample(
      platformId: id,
      type: HealthDataType.weight,
      value: kg,
      start: DateTime(2026, 9, day, 7, 2, 30),
      sourceId: source,
      sourceName: 'Bathroom scale',
    );

    setUp(() => store = create());

    test('starts empty, with no token', () async {
      for (final type in HealthDataType.values) {
        expect(await store.samples(type), isEmpty);
        expect(await store.token(type), isNull);
      }
    });

    test('a reading is read back with every field', () async {
      final workout = HealthSample(
        platformId: 'x-1',
        type: HealthDataType.workout,
        value: 55,
        start: DateTime(2026, 9, 2, 18),
        end: DateTime(2026, 9, 2, 18, 55),
        sourceId: 'com.example.watch',
        sourceName: 'Watch',
      );
      await store.upsert([weight('w-1', 82.6), workout]);
      expect(await store.samples(HealthDataType.weight), [weight('w-1', 82.6)]);
      expect(await store.samples(HealthDataType.workout), [workout]);
    });

    test('readings come oldest first', () async {
      await store.upsert([
        weight('b', 82, day: 3),
        weight('a', 83, day: 1),
        weight('c', 81, day: 2),
      ]);
      expect(
        [
          for (final s in await store.samples(HealthDataType.weight))
            s.platformId,
        ],
        ['a', 'c', 'b'],
      );
    });

    test('the same platform id again replaces the reading', () async {
      await store.upsert([weight('w-1', 82.6)]);
      await store.upsert([weight('w-1', 82.4, day: 2)]);
      expect(await store.samples(HealthDataType.weight), [
        weight('w-1', 82.4, day: 2),
      ]);
    });

    test('the same id under another type is another reading', () async {
      final fat = HealthSample(
        platformId: 'w-1',
        type: HealthDataType.bodyFat,
        value: 21.4,
        start: DateTime(2026, 9, 1, 7, 2),
        sourceId: 'scale',
        sourceName: 'Bathroom scale',
      );
      await store.upsert([weight('w-1', 82.6), fat]);
      expect(await store.samples(HealthDataType.weight), hasLength(1));
      expect(await store.samples(HealthDataType.bodyFat), [fat]);
    });

    test('delete removes the ids given, of that type only, and ignores '
        'ids it does not have', () async {
      final fat = HealthSample(
        platformId: 'w-1',
        type: HealthDataType.bodyFat,
        value: 21.4,
        start: DateTime(2026, 9, 1, 7, 2),
        sourceId: 'scale',
        sourceName: 'Bathroom scale',
      );
      await store.upsert([weight('w-1', 82.6), weight('w-2', 82.3), fat]);
      await store.delete(HealthDataType.weight, ['w-1', 'never-stored']);
      expect(await store.samples(HealthDataType.weight), [weight('w-2', 82.3)]);
      expect(await store.samples(HealthDataType.bodyFat), [fat]);
      await store.delete(HealthDataType.weight, const []);
      expect(await store.samples(HealthDataType.weight), hasLength(1));
    });

    test('replace leaves exactly what it is given, for that type', () async {
      final steps = HealthSample(
        platformId: 's-1',
        type: HealthDataType.steps,
        value: 8421,
        start: DateTime(2026, 9, 2),
        end: DateTime(2026, 9, 3),
        sourceId: 'watch',
        sourceName: 'Watch',
      );
      await store.upsert([weight('w-1', 82.6), weight('w-2', 82.3), steps]);
      await store.replace(HealthDataType.weight, [
        weight('w-2', 82.2),
        weight('w-3', 82.0, day: 4),
      ]);
      expect(await store.samples(HealthDataType.weight), [
        weight('w-2', 82.2),
        weight('w-3', 82.0, day: 4),
      ]);
      expect(await store.samples(HealthDataType.steps), [steps]);
      await store.replace(HealthDataType.weight, const []);
      expect(await store.samples(HealthDataType.weight), isEmpty);
    });

    test('a token is kept per type, and the latest wins', () async {
      await store.saveToken(HealthDataType.weight, 'a');
      await store.saveToken(HealthDataType.steps, 'b');
      await store.saveToken(HealthDataType.weight, 'c');
      expect(await store.token(HealthDataType.weight), 'c');
      expect(await store.token(HealthDataType.steps), 'b');
      expect(await store.token(HealthDataType.height), isNull);
    });
  });
}
