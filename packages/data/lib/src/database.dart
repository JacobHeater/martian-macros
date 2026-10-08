import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

part 'database.g.dart';

/// The single user's setup. One row, id = 1.
@DataClassName('SetupRow')
class Setups extends Table {
  IntColumn get id => integer().check(id.equals(1))();

  /// Biological sex. Constrained in the schema itself: no other value can
  /// ever be stored, and there is no default.
  TextColumn get sex => text().check(sex.isIn(const ['male', 'female']))();

  IntColumn get birthEpochDay => integer()();
  RealColumn get heightCm => real()();
  TextColumn get trainingStatus => textEnum<TrainingStatus>()();
  IntColumn get trainingDaysPerWeek => integer()();
  TextColumn get goalMode => textEnum<GoalMode>()();
  TextColumn get unitSystem => textEnum<UnitSystem>()();
  IntColumn get onboardedEpochDay => integer()();
  RealColumn get bodyFatPercent => real().nullable()();
  RealColumn get requestedLossFraction => real().nullable()();

  BoolColumn get pregnant => boolean().withDefault(const Constant(false))();
  BoolColumn get breastfeeding =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get eatingDisorderHistory =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get chronicKidneyDisease =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get androgenUse => boolean().withDefault(const Constant(false))();
  BoolColumn get pcos => boolean().withDefault(const Constant(false))();
  BoolColumn get menopause => boolean().withDefault(const Constant(false))();
  BoolColumn get thyroidCondition =>
      boolean().withDefault(const Constant(false))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// The canonical weigh-in for each calendar day.
@DataClassName('WeightRow')
class WeightEntries extends Table {
  IntColumn get epochDay => integer()();
  RealColumn get weightKg => real().check(weightKg.isBetweenValues(20, 500))();
  TextColumn get deviceId => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {epochDay};
}

@DataClassName('FoodRow')
class FoodEntries extends Table {
  IntColumn get id => integer().autoIncrement()();
  IntColumn get epochDay => integer()();
  TextColumn get meal => textEnum<Meal>()();
  TextColumn get name => text()();
  RealColumn get kcal => real().check(kcal.isBiggerOrEqualValue(0))();
  RealColumn get proteinG => real().check(proteinG.isBiggerOrEqualValue(0))();
  RealColumn get carbsG => real().check(carbsG.isBiggerOrEqualValue(0))();
  RealColumn get fatG => real().check(fatG.isBiggerOrEqualValue(0))();
  TextColumn get quantitySource => textEnum<QuantitySource>()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
}

/// Whether the user marked a day's log complete or partial.
@DataClassName('DayMarkRow')
class DayMarks extends Table {
  IntColumn get epochDay => integer()();
  TextColumn get completeness => textEnum<DayCompleteness>()();

  @override
  Set<Column<Object>> get primaryKey => {epochDay};
}

@DataClassName('WaistRow')
class WaistEntries extends Table {
  IntColumn get epochDay => integer()();
  RealColumn get waistCm => real().check(waistCm.isBetweenValues(30, 300))();

  @override
  Set<Column<Object>> get primaryKey => {epochDay};
}

/// Every set of targets ever issued, oldest first. Needed for the weekly
/// step limit and the continuous-deficit counter.
@DataClassName('TargetsRow')
class TargetsHistory extends Table {
  IntColumn get effectiveEpochDay => integer()();
  TextColumn get mode => textEnum<GoalMode>()();
  RealColumn get kcal => real()();
  RealColumn get proteinG => real()();
  RealColumn get fatG => real()();
  RealColumn get carbsG => real()();
  RealColumn get weeklyRateFraction => real()();

  /// Comma-separated `TargetFlag` names.
  TextColumn get flags => text().withDefault(const Constant(''))();

  RealColumn get tdeeKcal => real()();
  RealColumn get tdeeSigmaKcal => real()();
  TextColumn get tdeeStatus => textEnum<TdeeStatus>()();

  @override
  Set<Column<Object>> get primaryKey => {effectiveEpochDay};
}

@DriftDatabase(
  tables: [
    Setups,
    WeightEntries,
    FoodEntries,
    DayMarks,
    WaistEntries,
    TargetsHistory,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  /// Bump this with every change to a table, add the step to
  /// [migrationSteps], and run `mm schema` to export the new snapshot.
  static const currentSchemaVersion = 1;

  @override
  int get schemaVersion => currentSchemaVersion;

  /// One step per released version, keyed by the version it upgrades
  /// *from*. Step `n` takes a database at version `n` to version `n + 1`.
  /// Overridden only by tests.
  Map<int, MigrationStep> get migrationSteps => const {};

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

/// Upgrades the schema by exactly one version.
typedef MigrationStep = Future<void> Function(Migrator m);

/// The stored database could not be brought to the current schema. The
/// upgrade ran in a transaction, so the stored data is unchanged.
final class SchemaMigrationException implements Exception {
  SchemaMigrationException(this.from, this.to, this.cause);

  /// The data was written by a newer version of the app than this one.
  SchemaMigrationException.newerData(this.from, this.to) : cause = null;

  final int from;
  final int to;
  final Object? cause;

  @override
  String toString() => cause == null
      ? 'This data was saved by a newer version of the app (data version '
            '$from, app version $to). Your data is safe and unchanged. '
            'Update the app to open it.'
      : 'Your data is safe and unchanged, but it could not be upgraded '
            'from version $from to version $to. Cause: $cause';
}
