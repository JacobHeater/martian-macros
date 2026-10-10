import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import 'app_database.dart';

/// [InsightLogRepository] over the Drift database.
final class DriftInsightLogRepository implements InsightLogRepository {
  DriftInsightLogRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<InsightLogEntry>> watchInsightLog() =>
      (_db.select(_db.insightLog)..orderBy([
            (t) => OrderingTerm.asc(t.shownEpochDay),
            (t) => OrderingTerm.asc(t.id),
          ]))
          .watch()
          .map(
            (rows) => [
              for (final r in rows)
                InsightLogEntry(
                  rule: r.rule,
                  shownOn: CalendarDate.fromEpochDay(r.shownEpochDay),
                  dismissedOn: r.dismissedEpochDay == null
                      ? null
                      : CalendarDate.fromEpochDay(r.dismissedEpochDay!),
                ),
            ],
          );

  @override
  Future<void> recordInsightShown(InsightRule rule, CalendarDate day) => _db
      .into(_db.insightLog)
      .insert(
        InsightLogCompanion.insert(rule: rule, shownEpochDay: day.epochDay),
      );

  @override
  Future<void> dismissInsight(InsightRule rule, CalendarDate day) async {
    final latest =
        await (_db.select(_db.insightLog)
              ..where((t) => t.rule.equalsValue(rule))
              ..orderBy([
                (t) => OrderingTerm.desc(t.shownEpochDay),
                (t) => OrderingTerm.desc(t.id),
              ])
              ..limit(1))
            .getSingleOrNull();
    if (latest == null) return;
    await (_db.update(_db.insightLog)..where((t) => t.id.equals(latest.id)))
        .write(InsightLogCompanion(dismissedEpochDay: Value(day.epochDay)));
  }
}
