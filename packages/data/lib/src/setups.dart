import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

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

  /// Added in schema version 4 (MM-83); existing rows read as 0.
  IntColumn get profileRevision => integer().withDefault(const Constant(0))();

  /// Added in schema version 2 (MM-164); existing rows read as `light`.
  TextColumn get dailyActivity =>
      textEnum<DailyActivity>().withDefault(const Constant('light'))();
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
  BoolColumn get insulinOrSulfonylurea =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get insulinCareTeamConfirmed =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get bariatricSurgery =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get weightAffectingMedication =>
      boolean().withDefault(const Constant(false))();
  IntColumn get healthCheckConfirmedEpochDay => integer().nullable()();
  IntColumn get healthCheckSkipCount =>
      integer().withDefault(const Constant(0))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
