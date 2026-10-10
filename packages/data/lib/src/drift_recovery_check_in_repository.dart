import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [RecoveryCheckInRepository] over the Drift database.
final class DriftRecoveryCheckInRepository
    implements RecoveryCheckInRepository {
  DriftRecoveryCheckInRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<RecoveryCheckIn>> watchRecoveryCheckIns() =>
      (_db.select(
        _db.recoveryCheckIns,
      )..orderBy([(t) => OrderingTerm.asc(t.dateEpochDay)])).watch().map(
        (rows) => [
          for (final row in rows)
            RecoveryCheckIn(
              date: CalendarDate.fromEpochDay(row.dateEpochDay),
              hunger: row.hunger,
              energy: row.energy,
              sleep: row.sleep,
              training: row.training,
              mood: row.mood,
              sleepHours: row.sleepHours,
            ),
        ],
      );

  @override
  Future<void> saveRecoveryCheckIn(RecoveryCheckIn checkIn) => _db
      .into(_db.recoveryCheckIns)
      .insertOnConflictUpdate(
        RecoveryCheckInsCompanion.insert(
          dateEpochDay: Value(checkIn.date.epochDay),
          hunger: checkIn.hunger,
          energy: checkIn.energy,
          sleep: checkIn.sleep,
          training: checkIn.training,
          mood: checkIn.mood,
          sleepHours: Value(checkIn.sleepHours),
        ),
      );
}
