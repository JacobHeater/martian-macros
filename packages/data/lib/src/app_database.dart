import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'day_marks.dart';
import 'food_entries.dart';
import 'migration_step.dart';
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
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  /// Bump this with every change to a table, add the step to
  /// [migrationSteps], and run `mm schema` to export the new snapshot.
  static const currentSchemaVersion = 11;

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
