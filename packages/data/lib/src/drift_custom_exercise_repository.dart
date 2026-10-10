import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [CustomExerciseRepository] over the Drift database.
final class DriftCustomExerciseRepository implements CustomExerciseRepository {
  DriftCustomExerciseRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<Exercise>> watchCustomExercises() =>
      (_db.select(_db.customExercises)..orderBy([
            (t) => OrderingTerm.asc(t.name.lower()),
            (t) => OrderingTerm.asc(t.id),
          ]))
          .watch()
          .map(
            (rows) => [
              for (final row in rows)
                Exercise(
                  id: '${Exercise.customIdPrefix}${row.id}',
                  name: row.name,
                  equipment: row.equipment,
                  primary: row.primaryMuscle,
                  secondary: [
                    for (final name in row.secondaryMuscles.split(','))
                      if (name.isNotEmpty) MuscleGroup.values.byName(name),
                  ],
                  load: row.loadKind,
                ),
            ],
          );

  @override
  Future<String> saveCustomExercise(Exercise exercise) async {
    final row = CustomExercisesCompanion(
      name: Value(exercise.name),
      equipment: Value(exercise.equipment),
      primaryMuscle: Value(exercise.primary),
      secondaryMuscles: Value(
        [for (final muscle in exercise.secondary) muscle.name].join(','),
      ),
      loadKind: Value(exercise.load),
    );
    if (exercise.id.isEmpty) {
      final id = await _db.into(_db.customExercises).insert(row);
      return '${Exercise.customIdPrefix}$id';
    }
    final rowId = _rowId(exercise.id);
    if (rowId != null) {
      await (_db.update(
        _db.customExercises,
      )..where((t) => t.id.equals(rowId))).write(row);
    }
    return exercise.id;
  }

  @override
  Future<void> deleteCustomExercise(String id) async {
    final rowId = _rowId(id);
    if (rowId == null) return;
    await (_db.delete(
      _db.customExercises,
    )..where((t) => t.id.equals(rowId))).go();
  }

  /// The row behind a custom exercise's id; null for any other id.
  static int? _rowId(String id) => id.startsWith(Exercise.customIdPrefix)
      ? int.tryParse(id.substring(Exercise.customIdPrefix.length))
      : null;
}
