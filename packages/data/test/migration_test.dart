import 'dart:io';

import 'package:drift/native.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'generated_migrations/schema.dart';
import 'support/later_database.dart';

void main() {
  const current = AppDatabase.currentSchemaVersion;
  final day = CalendarDate(2026, 10, 5);
  late SchemaVerifier verifier;
  late Directory dir;
  late File file;

  setUpAll(() => verifier = SchemaVerifier(GeneratedHelper()));
  setUp(() {
    dir = Directory.systemTemp.createTempSync('mm_migration');
    file = File('${dir.path}/app.sqlite');
  });
  tearDown(() => dir.deleteSync(recursive: true));

  Future<void> writeVersion1Data() async {
    final store = MmStore(AppDatabase(NativeDatabase(file)));
    await store.saveSetup(
      UserSetup(
        profile: Profile(
          sex: BiologicalSex.female,
          birthDate: CalendarDate(1992, 4, 20),
          heightCm: 168,
        ),
        screening: const ScreeningAnswers(thyroidCondition: true),
        trainingStatus: TrainingStatus.novice,
        trainingDaysPerWeek: 3,
        goalMode: GoalMode.recomp,
        onboardedOn: day,
      ),
    );
    await store.saveWeight(day, 64.2);
    await store.addFood(
      FoodEntry(
        id: 0,
        date: day,
        meal: Meal.lunch,
        name: 'Rice bowl',
        kcal: 510,
        proteinG: 32,
        carbsG: 60,
        fatG: 14,
        source: QuantitySource.labelServing,
      ),
    );
    await store.close();
  }

  Future<void> expectVersion1DataIntact(AppDatabase db) async {
    final store = MmStore(db);
    final setup = await store.loadSetup();
    expect(setup!.profile.sex, BiologicalSex.female);
    expect(setup.screening.thyroidCondition, isTrue);
    expect((await store.watchWeights().first).single.weightKg, 64.2);
    expect((await store.watchFood(day).first).single.name, 'Rice bowl');
  }

  Future<int> userVersion(AppDatabase db) async =>
      (await db.customSelect('PRAGMA user_version').getSingle()).read<int>(
        'user_version',
      );

  Future<bool> hasColumn(AppDatabase db, String table, String column) async =>
      (await db.customSelect('PRAGMA table_info($table)').get()).any(
        (row) => row.read<String>('name') == column,
      );

  MigrationStep addColumn(String column) =>
      (m) => m.database.customStatement(
        'ALTER TABLE weight_entries ADD COLUMN $column TEXT',
      );

  group('snapshots', () {
    test('there is a snapshot for every version up to the current one', () {
      expect(GeneratedHelper.versions, [for (var v = 1; v <= current; v++) v]);
    });

    test('a fresh install matches the current snapshot, so a table changed '
        'without a version bump fails here', () async {
      final db = AppDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      await verifier.migrateAndValidate(db, current);
    });

    for (var from = 1; from < current; from++) {
      test('version $from upgrades to the current schema', () async {
        final schema = await verifier.schemaAt(from);
        final db = AppDatabase(schema.newConnection());
        addTearDown(db.close);
        await verifier.migrateAndValidate(db, current);
      });
    }
  });

  group('upgrading', () {
    test('keeps every row and sets the new version', () async {
      await writeVersion1Data();
      final db = LaterDatabase(NativeDatabase(file), current + 1, {
        current: addColumn('note'),
      });
      addTearDown(db.close);

      await expectVersion1DataIntact(db);
      expect(await userVersion(db), current + 1);
      expect(await hasColumn(db, 'weight_entries', 'note'), isTrue);
    });

    test('runs each step in turn when several versions behind', () async {
      await writeVersion1Data();
      final ran = <int>[];
      final db = LaterDatabase(NativeDatabase(file), current + 2, {
        current: (m) async {
          ran.add(current);
          await addColumn('first')(m);
        },
        current + 1: (m) async {
          ran.add(current + 1);
          await addColumn('second')(m);
        },
      });
      addTearDown(db.close);

      await expectVersion1DataIntact(db);
      expect(ran, [current, current + 1]);
      expect(await userVersion(db), current + 2);
    });

    test('keeps the sex constraint', () async {
      await writeVersion1Data();
      final db = LaterDatabase(NativeDatabase(file), current + 1, {
        current: addColumn('note'),
      });
      addTearDown(db.close);

      await expectLater(
        db.customStatement("UPDATE setups SET sex = 'other'"),
        throwsA(isA<SqliteException>()),
      );
    });
  });

  group('a failed upgrade', () {
    Future<void> expectUnchanged() async {
      final db = AppDatabase(NativeDatabase(file));
      addTearDown(db.close);
      await expectVersion1DataIntact(db);
      expect(await userVersion(db), current);
      expect(await hasColumn(db, 'weight_entries', 'first'), isFalse);
    }

    test('leaves the database as it was when a later step throws', () async {
      await writeVersion1Data();
      final failing = LaterDatabase(NativeDatabase(file), current + 2, {
        current: addColumn('first'),
        current + 1: (m) async => throw StateError('boom'),
      });
      await expectLater(
        failing.customSelect('SELECT 1').get(),
        throwsA(
          isA<SchemaMigrationException>().having(
            (e) => '$e',
            'message',
            allOf(contains('safe'), contains('boom')),
          ),
        ),
      );
      await failing.close();

      await expectUnchanged();
    });

    test('refuses when a step is missing', () async {
      await writeVersion1Data();
      final incomplete = LaterDatabase(NativeDatabase(file), current + 2, {
        current: addColumn('first'),
      });
      await expectLater(
        incomplete.customSelect('SELECT 1').get(),
        throwsA(isA<SchemaMigrationException>()),
      );
      await incomplete.close();

      await expectUnchanged();
    });

    test('refuses data saved by a newer version of the app', () async {
      await writeVersion1Data();
      final newer = LaterDatabase(NativeDatabase(file), current + 1, {
        current: addColumn('note'),
      });
      await newer.customSelect('SELECT 1').get();
      await newer.close();

      final older = AppDatabase(NativeDatabase(file));
      await expectLater(
        older.customSelect('SELECT 1').get(),
        throwsA(
          isA<SchemaMigrationException>().having(
            (e) => '$e',
            'message',
            allOf(contains('newer version'), contains('safe')),
          ),
        ),
      );
      await older.close();
    });
  });
}
