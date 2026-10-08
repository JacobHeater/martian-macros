import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';
import 'food_from_row.dart';

/// [IntakeReader] over the Drift database: the food log plus the day marks.
final class DriftIntakeReader implements IntakeReader {
  DriftIntakeReader(this._db);

  final AppDatabase _db;

  @override
  Stream<List<IntakeDay>> watchIntakeDays({required CalendarDate since}) {
    final food = (_db.select(
      _db.foodEntries,
    )..where((t) => t.epochDay.isBiggerOrEqualValue(since.epochDay))).watch();
    final marks = _db.select(_db.dayMarks).watch();
    return combineLatest(
      food,
      marks,
      (foodRows, markRows) => intakeDaysFrom(
        [for (final r in foodRows) foodFromRow(r)],
        {for (final m in markRows) m.epochDay: m.completeness},
      ),
    );
  }
}
