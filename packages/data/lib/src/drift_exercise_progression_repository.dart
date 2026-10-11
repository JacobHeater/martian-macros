import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [ExerciseProgressionRepository] over the Drift database.
final class DriftExerciseProgressionRepository
    implements ExerciseProgressionRepository {
  DriftExerciseProgressionRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<ExerciseProgression>> watchExerciseProgressions() =>
      (_db.select(
        _db.exerciseProgressions,
      )..orderBy([(t) => OrderingTerm.asc(t.exerciseId)])).watch().map(
        (rows) => [
          for (final row in rows)
            ExerciseProgression(
              exerciseId: row.exerciseId,
              repsLow: row.repsLow,
              repsHigh: row.repsHigh,
              loadStepKg: row.loadStepKg,
            ),
        ],
      );

  @override
  Future<void> saveExerciseProgression(ExerciseProgression progression) => _db
      .into(_db.exerciseProgressions)
      .insertOnConflictUpdate(
        ExerciseProgressionsCompanion.insert(
          exerciseId: progression.exerciseId,
          repsLow: progression.repsLow,
          repsHigh: progression.repsHigh,
          loadStepKg: Value(progression.loadStepKg),
        ),
      );

  @override
  Future<void> clearExerciseProgression(String exerciseId) => (_db.delete(
    _db.exerciseProgressions,
  )..where((t) => t.exerciseId.equals(exerciseId))).go();
}
