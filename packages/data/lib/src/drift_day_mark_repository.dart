import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [DayMarkRepository] over the Drift database.
final class DriftDayMarkRepository implements DayMarkRepository {
  DriftDayMarkRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<DayCompleteness> watchCompleteness(CalendarDate date) =>
      (_db.select(_db.dayMarks)..where((t) => t.epochDay.equals(date.epochDay)))
          .watchSingleOrNull()
          .map((r) => r?.completeness ?? DayCompleteness.unmarked);

  @override
  Future<void> setCompleteness(
    CalendarDate date,
    DayCompleteness completeness,
  ) => _db
      .into(_db.dayMarks)
      .insertOnConflictUpdate(
        DayMarksCompanion.insert(
          epochDay: Value(date.epochDay),
          completeness: completeness,
        ),
      );
}
