import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [WaistRepository] over the Drift database.
final class DriftWaistRepository implements WaistRepository {
  DriftWaistRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<WaistObservation>> watchWaist() =>
      (_db.select(
        _db.waistEntries,
      )..orderBy([(t) => OrderingTerm.asc(t.epochDay)])).watch().map(
        (rows) => [
          for (final r in rows)
            WaistObservation(
              date: CalendarDate.fromEpochDay(r.epochDay),
              waistCm: r.waistCm,
            ),
        ],
      );

  @override
  Future<void> saveWaist(CalendarDate date, double waistCm) => _db
      .into(_db.waistEntries)
      .insertOnConflictUpdate(
        WaistEntriesCompanion.insert(
          epochDay: Value(date.epochDay),
          waistCm: waistCm,
        ),
      );
}
