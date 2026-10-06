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

  @override
  int get schemaVersion => 1;
}
