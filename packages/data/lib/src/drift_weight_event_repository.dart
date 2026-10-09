import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [WeightEventRepository] over the Drift database.
final class DriftWeightEventRepository implements WeightEventRepository {
  DriftWeightEventRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<WeightEvent>> watchWeightEvents() =>
      (_db.select(
        _db.weightEvents,
      )..orderBy([(t) => OrderingTerm.asc(t.dateEpochDay)])).watch().map((
        rows,
      ) {
        final events = [for (final row in rows) _fromRow(row)];
        events.sort((a, b) {
          final byDate = a.date.compareTo(b.date);
          return byDate != 0 ? byDate : a.type.index.compareTo(b.type.index);
        });
        return events;
      });

  @override
  Future<void> saveWeightEvent(WeightEvent event) => _db
      .into(_db.weightEvents)
      .insertOnConflictUpdate(
        WeightEventsCompanion.insert(
          dateEpochDay: event.date.epochDay,
          type: event.type,
        ),
      );

  @override
  Future<void> deleteWeightEvent(WeightEvent event) async {
    await (_db.delete(_db.weightEvents)..where(
          (t) =>
              t.dateEpochDay.equals(event.date.epochDay) &
              t.type.equalsValue(event.type),
        ))
        .go();
  }

  WeightEvent _fromRow(WeightEventRow row) => WeightEvent(
    date: CalendarDate.fromEpochDay(row.dateEpochDay),
    type: row.type,
  );
}
