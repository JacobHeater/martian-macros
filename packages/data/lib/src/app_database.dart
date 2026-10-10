import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'custom_foods.dart';
import 'day_marks.dart';
import 'food_entries.dart';
import 'insight_log.dart';
import 'migration_step.dart';
import 'pauses.dart';
import 'recipe_ingredients.dart';
import 'recovery_check_ins.dart';
import 'reminders.dart';
import 'schema_migration_exception.dart';
import 'setups.dart';
import 'targets_history.dart';
import 'user_preferences.dart';
import 'waist_entries.dart';
import 'weight_entries.dart';
import 'weight_events.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    Setups,
    WeightEntries,
    FoodEntries,
    DayMarks,
    WaistEntries,
    TargetsHistory,
    UserPreferences,
    WeightEvents,
    CustomFoods,
    RecipeIngredients,
    InsightLog,
    Pauses,
    Reminders,
    RecoveryCheckIns,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  /// Bump this with every change to a table, add the step to
  /// [migrationSteps], and run `mm schema` to export the new snapshot.
  static const currentSchemaVersion = 24;

  @override
  int get schemaVersion => currentSchemaVersion;

  /// One step per released version, keyed by the version it upgrades
  /// *from*. Step `n` takes a database at version `n` to version `n + 1`.
  /// Overridden only by tests.
  Map<int, MigrationStep> get migrationSteps => {
    // 1 to 2: daily activity (MM-164) and display preferences (MM-165).
    1: (m) async {
      await m.addColumn(setups, setups.dailyActivity);
      await m.createTable(userPreferences);
    },
    // 2 to 3: the body-fat figure the safety rules used (MM-132).
    2: (m) async {
      await m.addColumn(targetsHistory, targetsHistory.safetyBodyFatPercent);
    },
    // 3 to 4: corrections to the profile or health check (MM-83).
    3: (m) async {
      await m.addColumn(setups, setups.profileRevision);
      await m.addColumn(targetsHistory, targetsHistory.profileRevision);
    },
    // 4 to 5: why each set of targets was issued (MM-138).
    4: (m) async {
      await m.addColumn(targetsHistory, targetsHistory.explanation);
    },
    // 5 to 6: expanded screening and repeat-check state (MM-112).
    5: (m) async {
      await m.addColumn(setups, setups.insulinOrSulfonylurea);
      await m.addColumn(setups, setups.insulinCareTeamConfirmed);
      await m.addColumn(setups, setups.bariatricSurgery);
      await m.addColumn(setups, setups.weightAffectingMedication);
      await m.addColumn(setups, setups.healthCheckConfirmedEpochDay);
      await m.addColumn(setups, setups.healthCheckSkipCount);
    },
    // 6 to 7: the protein minimum stored with each target (MM-121).
    6: (m) async {
      await m.addColumn(targetsHistory, targetsHistory.proteinMinimumG);
    },
    // 7 to 8: show each newly issued target explanation once (MM-138).
    7: (m) async {
      await m.addColumn(targetsHistory, targetsHistory.summarySeen);
    },
    // 8 to 9: track which target-calculation rules issued each record.
    8: (m) async {
      await m.addColumn(targetsHistory, targetsHistory.targetRulesVersion);
    },
    // 9 to 10: persist weight events and the onboarding creatine start date.
    9: (m) async {
      await m.addColumn(setups, setups.creatineStartedEpochDay);
      await m.createTable(weightEvents);
    },
    // 10 to 11: how much was eaten and what the totals are for (MM-167).
    // Existing entries keep null portions; nothing is invented for them.
    10: (m) async {
      await m.addColumn(foodEntries, foodEntries.portionQuantity);
      await m.addColumn(foodEntries, foodEntries.portionUnit);
      await m.addColumn(foodEntries, foodEntries.nutritionBasis);
      await m.addColumn(foodEntries, foodEntries.referenceBasis);
      await m.addColumn(foodEntries, foodEntries.referenceKcal);
      await m.addColumn(foodEntries, foodEntries.referenceProteinG);
      await m.addColumn(foodEntries, foodEntries.referenceCarbsG);
      await m.addColumn(foodEntries, foodEntries.referenceFatG);
      await m.addColumn(foodEntries, foodEntries.servingDescription);
      await m.addColumn(foodEntries, foodEntries.servingGrams);
      await m.addColumn(foodEntries, foodEntries.servingMilliliters);
      await m.addColumn(foodEntries, foodEntries.servingUnit);
      await m.addColumn(foodEntries, foodEntries.densityGPerMl);
    },
    // 11 to 12: the user's own foods and recipes (MM-45).
    11: (m) async {
      await m.createTable(customFoods);
      await m.createTable(recipeIngredients);
    },
    // 12 to 13: the easy-to-miss line's setting and when it was last shown
    // (MM-152).
    12: (m) async {
      // The table is created at its current shape when a database is old
      // enough to lack it (step 1), so only add what is not there yet.
      final existing = {
        for (final row in await customSelect(
          'PRAGMA table_info(user_preferences)',
        ).get())
          row.read<String>('name'),
      };
      if (!existing.contains('easy_to_miss_enabled')) {
        await m.addColumn(userPreferences, userPreferences.easyToMissEnabled);
      }
      if (!existing.contains('easy_to_miss_last_shown_epoch_day')) {
        await m.addColumn(
          userPreferences,
          userPreferences.easyToMissLastShownEpochDay,
        );
      }
    },
    // 13 to 14: the food an entry was logged from (MM-167).
    13: (m) async {
      final existing = {
        for (final row in await customSelect(
          'PRAGMA table_info(food_entries)',
        ).get())
          row.read<String>('name'),
      };
      for (final (name, column) in [
        ('origin_pack_id', foodEntries.originPackId),
        ('origin_food_id', foodEntries.originFoodId),
        ('origin_source', foodEntries.originSource),
        ('origin_source_id', foodEntries.originSourceId),
      ]) {
        if (!existing.contains(name)) await m.addColumn(foodEntries, column);
      }
    },
    // 14 to 15: nutrients beyond the macros and the detail setting (MM-49).
    14: (m) async {
      Future<Set<String>> columnsOf(String table) async => {
        for (final row in await customSelect('PRAGMA table_info($table)').get())
          row.read<String>('name'),
      };
      final food = await columnsOf('food_entries');
      for (final (name, column) in [
        ('fiber_g', foodEntries.fiberG),
        ('sodium_mg', foodEntries.sodiumMg),
        ('alcohol_g', foodEntries.alcoholG),
      ]) {
        if (!food.contains(name)) await m.addColumn(foodEntries, column);
      }
      if (!(await columnsOf('user_preferences')).contains('detail_level')) {
        await m.addColumn(userPreferences, userPreferences.detailLevel);
      }
    },
    // 15 to 16: what a hand portion implied, and the model's version (MM-46).
    15: (m) async {
      final existing = {
        for (final row in await customSelect(
          'PRAGMA table_info(food_entries)',
        ).get())
          row.read<String>('name'),
      };
      if (!existing.contains('implied_grams')) {
        await m.addColumn(foodEntries, foodEntries.impliedGrams);
      }
      if (!existing.contains('hand_model_version')) {
        await m.addColumn(foodEntries, foodEntries.handModelVersion);
      }
    },
    // 16 to 17: when the under-eating notice was last dismissed (MM-114).
    16: (m) async {
      final existing = {
        for (final row in await customSelect(
          'PRAGMA table_info(user_preferences)',
        ).get())
          row.read<String>('name'),
      };
      if (!existing.contains('under_eating_dismissed_epoch_day')) {
        await m.addColumn(
          userPreferences,
          userPreferences.underEatingDismissedEpochDay,
        );
      }
    },
    // 17 to 18: when the welcome-back screen was last put off (MM-147).
    17: (m) async {
      final existing = {
        for (final row in await customSelect(
          'PRAGMA table_info(user_preferences)',
        ).get())
          row.read<String>('name'),
      };
      if (!existing.contains('return_screen_dismissed_epoch_day')) {
        await m.addColumn(
          userPreferences,
          userPreferences.returnScreenDismissedEpochDay,
        );
      }
    },
    // 18 to 19: the log of shown and dismissed insights (MM-141).
    18: (m) async {
      await m.createTable(insightLog);
    },
    // 19 to 20: pauses for travel, illness and injury (MM-148).
    19: (m) async {
      await m.createTable(pauses);
    },
    // 20 to 21: reminder settings (MM-146).
    20: (m) async {
      await m.createTable(reminders);
    },
    // 21 to 22: the weekly recovery check-in and when it was last skipped
    // (MM-116).
    21: (m) async {
      await m.createTable(recoveryCheckIns);
      final existing = {
        for (final row in await customSelect(
          'PRAGMA table_info(user_preferences)',
        ).get())
          row.read<String>('name'),
      };
      if (!existing.contains('recovery_check_in_skipped_epoch_day')) {
        await m.addColumn(
          userPreferences,
          userPreferences.recoveryCheckInSkippedEpochDay,
        );
      }
    },
    // 22 to 23: a maintenance week taken early, and when the offer to ease
    // a deficit was last answered (MM-117).
    22: (m) async {
      await m.addColumn(setups, setups.maintenanceWeekFromEpochDay);
      await m.addColumn(setups, setups.reliefAnsweredEpochDay);
    },
    // 23 to 24: fresh installs choose a theme; upgrades retain old appearance.
    23: (m) async {
      await m.alterTable(TableMigration(userPreferences));
      await into(userPreferences).insert(
        UserPreferencesCompanion.insert(
          id: const Value(1),
          themePreference: const Value(ThemePreference.system),
        ),
        mode: InsertMode.insertOrIgnore,
      );
    },
  };

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from > to) throw SchemaMigrationException.newerData(from, to);
      try {
        // All steps or none: a failure leaves the database at `from`.
        await transaction(() async {
          for (var version = from; version < to; version++) {
            final step = migrationSteps[version];
            if (step == null) {
              throw StateError('No migration from schema version $version.');
            }
            await step(m);
          }
        });
      } catch (cause) {
        throw SchemaMigrationException(from, to, cause);
      }
    },
  );
}
