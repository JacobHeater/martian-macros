import 'dart:io';

import 'package:drift/native.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:mm_data/mm_data.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
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
    final repos = DriftRepositories(AppDatabase(NativeDatabase(file)));
    await repos.setup.saveSetup(
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
    await repos.weights.saveWeight(day, 64.2);
    await repos.food.addFood(
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
    await repos.close();
  }

  Future<void> expectVersion1DataIntact(AppDatabase db) async {
    final repos = DriftRepositories(db);
    final setup = await repos.setup.loadSetup();
    expect(setup!.profile.sex, BiologicalSex.female);
    expect(setup.screening.thyroidCondition, isTrue);
    expect((await repos.weights.watchWeights().first).single.weightKg, 64.2);
    expect((await repos.food.watchFood(day).first).single.name, 'Rice bowl');
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

  group('from released version 1 (MM-164, MM-165, MM-132, MM-83)', () {
    test('a saved setup and targets survive every later step, with each new '
        'field at its default', () async {
      final schema = await verifier.schemaAt(1);
      schema.rawDatabase.execute(
        'INSERT INTO setups (id, sex, birth_epoch_day, height_cm, '
        'training_status, training_days_per_week, goal_mode, unit_system, '
        'onboarded_epoch_day, thyroid_condition) VALUES '
        "(1, 'female', ${CalendarDate(1992, 4, 20).epochDay}, 168, 'novice', "
        "3, 'recomp', 'imperial', ${day.epochDay}, 1)",
      );
      schema.rawDatabase.execute(
        'INSERT INTO targets_history (effective_epoch_day, mode, kcal, '
        'protein_g, fat_g, carbs_g, weekly_rate_fraction, tdee_kcal, '
        "tdee_sigma_kcal, tdee_status) VALUES (${day.epochDay}, 'recomp', "
        "2200, 150, 60, 250, -0.001, 2500, 300, 'held')",
      );
      final db = AppDatabase(schema.newConnection());
      addTearDown(db.close);
      await verifier.migrateAndValidate(db, current);

      final repos = DriftRepositories(db);
      final setup = (await repos.setup.loadSetup())!;
      expect(setup.profile.sex, BiologicalSex.female);
      expect(setup.screening.thyroidCondition, isTrue);
      expect(setup.trainingDaysPerWeek, 3);
      expect(setup.goalMode, GoalMode.recomp);
      expect(setup.dailyActivity, DailyActivity.light);
      expect(setup.profileRevision, 0);
      expect(setup.screening.insulinOrSulfonylurea, isFalse);
      expect(setup.screening.bariatricSurgery, isFalse);
      expect(setup.healthCheckConfirmedOn, isNull);
      expect(setup.healthCheckSkipCount, 0);
      final targets = (await repos.targets.watchTargetsHistory().first).single;
      expect(targets.mode, GoalMode.recomp);
      expect(targets.safetyBodyFatPercent, isNull);
      expect(targets.profileRevision, 0);
      expect(targets.targets.proteinMinimumG, isNull);
      expect(targets.summarySeen, isTrue);
      expect(
        await repos.preferences.watchThemePreference().first,
        ThemePreference.system,
      );
      await repos.preferences.saveThemePreference(ThemePreference.dark);
      expect(
        await repos.preferences.watchThemePreference().first,
        ThemePreference.dark,
      );
    });

    test('MM-112 health answers and re-check state round-trip', () async {
      final db = AppDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final repos = DriftRepositories(db);
      final confirmed = CalendarDate(2026, 10, 5);
      final setup = UserSetup(
        profile: Profile(
          sex: BiologicalSex.female,
          birthDate: CalendarDate(1960, 1, 1),
          heightCm: 168,
        ),
        screening: const ScreeningAnswers(
          insulinOrSulfonylurea: true,
          insulinCareTeamConfirmed: true,
          bariatricSurgery: true,
          weightAffectingMedication: true,
        ),
        trainingStatus: TrainingStatus.novice,
        trainingDaysPerWeek: 3,
        goalMode: GoalMode.maintenance,
        onboardedOn: confirmed,
        healthCheckConfirmedOn: confirmed,
        healthCheckSkipCount: 1,
      );
      await repos.setup.saveSetup(setup);

      final loaded = (await repos.setup.loadSetup())!;
      expect(loaded.screening.insulinOrSulfonylurea, isTrue);
      expect(loaded.screening.insulinCareTeamConfirmed, isTrue);
      expect(loaded.screening.bariatricSurgery, isTrue);
      expect(loaded.screening.weightAffectingMedication, isTrue);
      expect(loaded.healthCheckConfirmedOn, confirmed);
      expect(loaded.healthCheckSkipCount, 1);
    });

    test('MM-121 protein minimum round-trips with target history', () async {
      final db = AppDatabase(NativeDatabase.memory());
      addTearDown(db.close);
      final repos = DriftRepositories(db);
      await repos.targets.saveTargets(
        TargetsRecord(
          effectiveFrom: day,
          mode: GoalMode.fatLoss,
          tdeeKcal: 2800,
          tdeeSigmaKcal: 250,
          tdeeStatus: TdeeStatus.updated,
          targets: const DailyTargets(
            kcal: 2200,
            proteinG: 160,
            proteinMinimumG: 128,
            fatG: 70,
            carbsG: 230,
            weeklyRateFraction: -0.0075,
          ),
        ),
      );

      final loaded = (await repos.targets.watchTargetsHistory().first).single;
      expect(loaded.targets.proteinMinimumG, 128);
      expect(loaded.targets.proteinG, 160);
    });
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
