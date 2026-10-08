import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

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

  /// Added in schema version 3 (MM-132); null on older rows.
  RealColumn get safetyBodyFatPercent => real().nullable()();
  TextColumn get tdeeStatus => textEnum<TdeeStatus>()();

  @override
  Set<Column<Object>> get primaryKey => {effectiveEpochDay};
}
