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
  RealColumn get proteinMinimumG => real().nullable()();
  RealColumn get fatG => real()();
  RealColumn get carbsG => real()();
  RealColumn get weeklyRateFraction => real()();

  /// Comma-separated `TargetFlag` names.
  TextColumn get flags => text().withDefault(const Constant(''))();

  RealColumn get tdeeKcal => real()();
  RealColumn get tdeeSigmaKcal => real()();

  /// Why these targets were issued, as JSON (`TargetsExplanation.encode`).
  /// Added in schema version 5 (MM-138); null on older rows.
  TextColumn get explanation => text().nullable()();

  /// Existing target history should not trigger new summary dialogs.
  BoolColumn get summarySeen => boolean().withDefault(const Constant(true))();

  /// Rules used to issue targets; bump [currentTargetRulesVersion] when target
  /// calculation behavior changes.
  IntColumn get targetRulesVersion =>
      integer().withDefault(const Constant(currentTargetRulesVersion))();

  /// Added in schema version 4 (MM-83); older rows read as 0.
  IntColumn get profileRevision => integer().withDefault(const Constant(0))();

  /// Added in schema version 3 (MM-132); null on older rows.
  RealColumn get safetyBodyFatPercent => real().nullable()();
  TextColumn get tdeeStatus => textEnum<TdeeStatus>()();

  @override
  Set<Column<Object>> get primaryKey => {effectiveEpochDay};
}
