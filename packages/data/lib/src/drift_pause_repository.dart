import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [PauseRepository] over the Drift database.
final class DriftPauseRepository implements PauseRepository {
  DriftPauseRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<Pause>> watchPauses() =>
      (_db.select(
        _db.pauses,
      )..orderBy([(t) => OrderingTerm.asc(t.fromEpochDay)])).watch().map(
        (rows) => [
          for (final row in rows)
            Pause(
              from: CalendarDate.fromEpochDay(row.fromEpochDay),
              to: CalendarDate.fromEpochDay(row.toEpochDay),
              reason: row.reason,
              extended: row.extended,
            ),
        ],
      );

  @override
  Future<void> savePause(Pause pause) => _db
      .into(_db.pauses)
      .insertOnConflictUpdate(
        PausesCompanion.insert(
          fromEpochDay: Value(pause.from.epochDay),
          toEpochDay: pause.to.epochDay,
          reason: pause.reason,
          extended: Value(pause.extended),
        ),
      );

  @override
  Future<void> deletePause(Pause pause) async {
    await (_db.delete(
      _db.pauses,
    )..where((t) => t.fromEpochDay.equals(pause.from.epochDay))).go();
  }
}
