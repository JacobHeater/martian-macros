import 'package:mm_health_ingest/mm_health_ingest.dart';
import 'package:mm_health_ingest/mm_health_ingest_testing.dart';
import 'package:test/test.dart';

/// MM-67: the health seam, its fake, and importing through it.
void main() {
  final longAgo = DateTime(2000);
  final farAhead = DateTime(2100);

  Future<FakeHealthSource> permitted({int? happened}) async {
    final source = FakeHealthSource.fromJson(
      recordedHealthHistory,
      happened: happened,
    );
    await source.permit();
    return source;
  }

  healthSourceContract('the fake with the whole history', permitted);
  healthSourceContract(
    'the fake part way through its history',
    () => permitted(happened: 5),
  );
  healthSourceContract('the fake with only weight permitted', () async {
    final source = FakeHealthSource.fromJson(recordedHealthHistory);
    await source.permit({HealthDataType.weight});
    return source;
  });
  healthSourceContract(
    'the fake with nothing permitted',
    () async => FakeHealthSource.fromJson(recordedHealthHistory),
  );

  healthSampleStoreContract('In-memory', InMemoryHealthSampleStore.new);

  group('the fake', () {
    test(
      'serves the recorded history: sources, an edit and a deletion',
      () async {
        final source = await permitted();
        final weights = await source.read(
          HealthDataType.weight,
          from: longAgo,
          to: farAhead,
        );
        expect(weights.map((s) => s.platformId), [
          'w-1',
          'w-3',
          'w-4',
          'w-5',
          'w-6',
        ]);
        final edited = weights[1];
        expect(edited.value, 82.4);
        expect(edited.sourceId, 'com.example.manual');
        expect(edited.sourceName, 'Health app, typed');
        expect(weights.first.sourceName, 'Bathroom scale');
        expect(await source.available(), {
          HealthDataType.weight,
          HealthDataType.bodyFat,
          HealthDataType.steps,
          HealthDataType.workout,
          HealthDataType.height,
        });
      },
    );

    test('a reading with a span keeps its end', () async {
      final source = await permitted();
      final workout = (await source.read(
        HealthDataType.workout,
        from: longAgo,
        to: farAhead,
      )).single;
      expect(workout.value, 55);
      expect(workout.end, DateTime(2026, 9, 2, 18, 55));
    });

    test(
      'before the edit and the deletion it shows what was there then',
      () async {
        final source = await permitted(happened: 9);
        final weights = await source.read(
          HealthDataType.weight,
          from: longAgo,
          to: farAhead,
        );
        expect(weights.map((s) => s.platformId), [
          'w-1',
          'w-2',
          'w-3',
          'w-4',
          'w-5',
        ]);
        expect(weights[2].value, 83.0);
      },
    );

    test(
      'changes since a token: the edit, the deletion and the new one',
      () async {
        final source = await permitted(happened: 9);
        final first = await source.changesSince(HealthDataType.weight, null);
        expect(first.upserted, hasLength(5));

        source.letAllHappen();
        final changes = await source.changesSince(
          HealthDataType.weight,
          first.nextToken,
        );
        expect(changes.upserted.map((s) => s.platformId), ['w-3', 'w-6']);
        expect(changes.upserted.first.value, 82.4);
        expect(changes.deletedIds, ['w-2']);
      },
    );

    test('a reading added and deleted between two imports is only a '
        'deletion', () async {
      final source = await permitted(happened: 1);
      final first = await source.changesSince(HealthDataType.weight, null);
      source.letAllHappen();
      final changes = await source.changesSince(
        HealthDataType.weight,
        first.nextToken,
      );
      expect(changes.upserted.map((s) => s.platformId), isNot(contains('w-2')));
      expect(changes.deletedIds, ['w-2']);
    });

    test('an expired token says so', () async {
      final source = await permitted();
      final first = await source.changesSince(HealthDataType.weight, null);
      source.expireTokens();
      final changes = await source.changesSince(
        HealthDataType.weight,
        first.nextToken,
      );
      expect(changes.tokenExpired, isTrue);
      expect(changes.nextToken, isEmpty);
    });

    test('permission is asked for, and the user may refuse some', () async {
      final source = FakeHealthSource.fromJson(recordedHealthHistory)
        ..willPermit = {HealthDataType.weight};
      expect(await source.permitted(), isEmpty);
      final after = await source.requestPermission({
        HealthDataType.weight,
        HealthDataType.steps,
        HealthDataType.menstruation,
      });
      expect(after, {HealthDataType.weight});
    });

    test('nutrition is written by id, or refused', () async {
      final source = await permitted();
      NutritionRecord meal(double kcal) => NutritionRecord(
        id: 'meal-1',
        start: DateTime(2026, 9, 9, 12),
        end: DateTime(2026, 9, 9, 12, 30),
        kcal: kcal,
        proteinG: 40,
        carbsG: 60,
        fatG: 20,
      );
      expect(await source.writeNutrition(meal(600)), isTrue);
      expect(await source.writeNutrition(meal(650)), isTrue);
      expect(source.written.values.single.kcal, 650);

      source.takesNutrition = false;
      expect(await source.writeNutrition(meal(700)), isFalse);
      expect(source.written.values.single.kcal, 650);
    });
  });

  group('importing', () {
    late FakeHealthSource source;
    late InMemoryHealthSampleStore store;
    late HealthImporter importer;

    Future<void> setUpWith({int? happened}) async {
      source = await permitted(happened: happened);
      store = InMemoryHealthSampleStore();
      importer = HealthImporter(source: source, store: store);
    }

    Future<List<String>> storedWeights() async => [
      for (final s in await store.samples(HealthDataType.weight)) s.platformId,
    ];

    test(
      'the first import brings everything, with where it came from',
      () async {
        await setUpWith();
        final result = await importer.import(HealthDataType.weight);
        expect(result.status, HealthImportStatus.updated);
        expect(result.upserted, 5);
        final stored = await store.samples(HealthDataType.weight);
        expect(stored, hasLength(5));
        expect(
          {for (final s in stored) s.sourceId},
          {'com.example.scale', 'com.example.manual'},
        );
      },
    );

    test('importing twice does not duplicate', () async {
      await setUpWith();
      await importer.import(HealthDataType.weight);
      final again = await importer.import(HealthDataType.weight);
      expect(again.upserted, 0);
      expect(again.deleted, 0);
      expect(await storedWeights(), hasLength(5));
    });

    test('importing again with a token the platform does not know does '
        'not duplicate either', () async {
      await setUpWith();
      await importer.import(HealthDataType.weight);
      await store.saveToken(HealthDataType.weight, 'forgotten');
      final again = await importer.import(HealthDataType.weight);
      expect(again.status, HealthImportStatus.readAgain);
      expect(await storedWeights(), hasLength(5));
    });

    test('a reading deleted on the platform is removed', () async {
      await setUpWith(happened: 9);
      await importer.import(HealthDataType.weight);
      expect(await storedWeights(), contains('w-2'));

      source.letAllHappen();
      final result = await importer.import(HealthDataType.weight);
      expect(result.deleted, 1);
      expect(await storedWeights(), ['w-1', 'w-3', 'w-4', 'w-5', 'w-6']);
    });

    test('a reading edited on the platform is brought up to date', () async {
      await setUpWith(happened: 9);
      await importer.import(HealthDataType.weight);
      source.letAllHappen();
      await importer.import(HealthDataType.weight);
      final edited = (await store.samples(HealthDataType.weight))
          .firstWhere((s) => s.platformId == 'w-3');
      expect(edited.value, 82.4);
    });

    test('an expired token: everything is read again, and what the '
        'platform no longer has is gone', () async {
      await setUpWith(happened: 9);
      await importer.import(HealthDataType.weight);
      source
        ..letAllHappen()
        ..expireTokens();

      final result = await importer.import(HealthDataType.weight);
      expect(result.status, HealthImportStatus.readAgain);
      expect(await storedWeights(), ['w-1', 'w-3', 'w-4', 'w-5', 'w-6']);

      final after = await importer.import(HealthDataType.weight);
      expect(after.status, HealthImportStatus.updated);
      expect(after.upserted, 0);
    });

    test('each type is imported and kept apart', () async {
      await setUpWith();
      await importer.import(HealthDataType.weight);
      await importer.import(HealthDataType.bodyFat);
      expect(await store.samples(HealthDataType.bodyFat), hasLength(1));
      expect(await store.samples(HealthDataType.steps), isEmpty);

      await store.replace(HealthDataType.bodyFat, const []);
      expect(await storedWeights(), hasLength(5));
    });

    test('a type the user has not permitted is left alone', () async {
      source = FakeHealthSource.fromJson(recordedHealthHistory);
      await source.permit({HealthDataType.steps});
      store = InMemoryHealthSampleStore();
      importer = HealthImporter(source: source, store: store);

      final result = await importer.import(HealthDataType.weight);
      expect(result.status, HealthImportStatus.notPermitted);
      expect(await storedWeights(), isEmpty);
      expect(await store.token(HealthDataType.weight), isNull);
    });
  });
}
