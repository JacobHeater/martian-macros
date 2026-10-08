import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [WeightRepository] over the Drift database.
final class DriftWeightRepository implements WeightRepository {
  DriftWeightRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<WeightObservation>> watchWeights() =>
      (_db.select(_db.weightEntries)
            ..orderBy([(t) => OrderingTerm.asc(t.epochDay)]))
          .watch()
          .map((rows) => [for (final r in rows) _weight(r)]);

  @override
  Future<void> saveWeight(CalendarDate date, double weightKg) => _db
      .into(_db.weightEntries)
      .insertOnConflictUpdate(
        WeightEntriesCompanion.insert(
          epochDay: Value(date.epochDay),
          weightKg: weightKg,
        ),
      );

  @override
  Future<void> deleteWeight(CalendarDate date) => (_db.delete(
    _db.weightEntries,
  )..where((t) => t.epochDay.equals(date.epochDay))).go();

  WeightObservation _weight(WeightRow r) => WeightObservation(
    date: CalendarDate.fromEpochDay(r.epochDay),
    weightKg: r.weightKg,
    deviceId: r.deviceId,
  );
}
