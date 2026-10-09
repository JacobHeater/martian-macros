import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'app_database.dart';

/// [TargetsHistoryRepository] over the Drift database.
final class DriftTargetsHistoryRepository implements TargetsHistoryRepository {
  DriftTargetsHistoryRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<TargetsRecord>> watchTargetsHistory() =>
      (_db.select(_db.targetsHistory)
            ..orderBy([(t) => OrderingTerm.asc(t.effectiveEpochDay)]))
          .watch()
          .map((rows) => [for (final r in rows) _targets(r)]);

  @override
  Future<void> saveTargets(TargetsRecord record) => _db
      .into(_db.targetsHistory)
      .insertOnConflictUpdate(
        TargetsHistoryCompanion.insert(
          effectiveEpochDay: Value(record.effectiveFrom.epochDay),
          mode: record.mode,
          kcal: record.targets.kcal,
          proteinG: record.targets.proteinG,
          proteinMinimumG: Value(record.targets.proteinMinimumG),
          fatG: record.targets.fatG,
          carbsG: record.targets.carbsG,
          weeklyRateFraction: record.targets.weeklyRateFraction,
          flags: Value(record.targets.flags.map((f) => f.name).join(',')),
          tdeeKcal: record.tdeeKcal,
          tdeeSigmaKcal: record.tdeeSigmaKcal,
          tdeeStatus: record.tdeeStatus,
          safetyBodyFatPercent: Value(record.safetyBodyFatPercent),
          profileRevision: Value(record.profileRevision),
          explanation: Value(record.explanation?.encode()),
          summarySeen: Value(record.summarySeen),
        ),
      );

  @override
  Future<void> markSummariesSeenThrough(CalendarDate effectiveFrom) =>
      (_db.update(_db.targetsHistory)..where(
            (t) =>
                t.effectiveEpochDay.isSmallerOrEqualValue(
                  effectiveFrom.epochDay,
                ) &
                t.summarySeen.equals(false),
          ))
          .write(const TargetsHistoryCompanion(summarySeen: Value(true)));

  TargetsRecord _targets(TargetsRow r) => TargetsRecord(
    effectiveFrom: CalendarDate.fromEpochDay(r.effectiveEpochDay),
    mode: r.mode,
    tdeeKcal: r.tdeeKcal,
    tdeeSigmaKcal: r.tdeeSigmaKcal,
    tdeeStatus: r.tdeeStatus,
    safetyBodyFatPercent: r.safetyBodyFatPercent,
    profileRevision: r.profileRevision,
    explanation: r.explanation == null
        ? null
        : TargetsExplanation.decode(r.explanation!),
    summarySeen: r.summarySeen,
    targets: DailyTargets(
      kcal: r.kcal,
      proteinG: r.proteinG,
      proteinMinimumG: r.proteinMinimumG,
      fatG: r.fatG,
      carbsG: r.carbsG,
      weeklyRateFraction: r.weeklyRateFraction,
      flags: {
        for (final name in r.flags.split(','))
          if (name.isNotEmpty) TargetFlag.values.byName(name),
      },
    ),
  );
}
