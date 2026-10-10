import 'package:drift/drift.dart';
import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';

/// [WorkoutRepository] over the Drift database.
final class DriftWorkoutRepository implements WorkoutRepository {
  DriftWorkoutRepository(this._db);

  final AppDatabase _db;

  @override
  Stream<List<Workout>> watchWorkouts() {
    final query = _db.select(_db.workouts)
      ..orderBy([
        (t) => OrderingTerm.desc(t.startedAtMs),
        (t) => OrderingTerm.desc(t.id),
      ]);
    // The query reads one table but the result holds three, so it has to
    // run again when an exercise or a set changes too.
    return _db
        .customSelect(
          'SELECT 1',
          readsFrom: {_db.workouts, _db.workoutExercises, _db.workoutSets},
        )
        .watch()
        .asyncMap((_) async => _withExercises(await query.get()));
  }

  Future<List<Workout>> _withExercises(List<WorkoutRow> rows) async {
    final exerciseRows = await (_db.select(
      _db.workoutExercises,
    )..orderBy([(t) => OrderingTerm.asc(t.position)])).get();
    final setRows = await (_db.select(
      _db.workoutSets,
    )..orderBy([(t) => OrderingTerm.asc(t.position)])).get();

    final sets = <(int, int), List<WorkoutSet>>{};
    for (final row in setRows) {
      sets
          .putIfAbsent((row.workoutId, row.exercisePosition), () => [])
          .add(
            WorkoutSet(
              reps: row.reps,
              loadKg: row.loadKg,
              rir: row.rir,
              startedAt: _time(row.startedAtMs),
              endedAt: _time(row.endedAtMs),
            ),
          );
    }
    final exercises = <int, List<WorkoutExercise>>{};
    for (final row in exerciseRows) {
      exercises
          .putIfAbsent(row.workoutId, () => [])
          .add(
            WorkoutExercise(
              exerciseId: row.exerciseId,
              sets: sets[(row.workoutId, row.position)] ?? const [],
            ),
          );
    }
    return [
      for (final row in rows)
        Workout(
          id: row.id,
          date: CalendarDate.fromEpochDay(row.dateEpochDay),
          startedAt: DateTime.fromMillisecondsSinceEpoch(row.startedAtMs),
          endedAt: _time(row.endedAtMs),
          setStartedAt: _time(row.setStartedAtMs),
          exercises: exercises[row.id] ?? const [],
        ),
    ];
  }

  @override
  Future<int> saveWorkout(Workout workout) => _db.transaction(() async {
    final row = WorkoutsCompanion(
      dateEpochDay: Value(workout.date.epochDay),
      startedAtMs: Value(workout.startedAt.millisecondsSinceEpoch),
      endedAtMs: Value(workout.endedAt?.millisecondsSinceEpoch),
      setStartedAtMs: Value(workout.setStartedAt?.millisecondsSinceEpoch),
    );
    final int id;
    if (workout.id == 0) {
      id = await _db.into(_db.workouts).insert(row);
    } else {
      id = workout.id;
      await (_db.update(
        _db.workouts,
      )..where((t) => t.id.equals(id))).write(row);
      await _deleteChildren(id);
    }
    for (var e = 0; e < workout.exercises.length; e++) {
      final exercise = workout.exercises[e];
      await _db
          .into(_db.workoutExercises)
          .insert(
            WorkoutExercisesCompanion.insert(
              workoutId: id,
              position: e,
              exerciseId: exercise.exerciseId,
            ),
          );
      for (var s = 0; s < exercise.sets.length; s++) {
        final set = exercise.sets[s];
        await _db
            .into(_db.workoutSets)
            .insert(
              WorkoutSetsCompanion.insert(
                workoutId: id,
                exercisePosition: e,
                position: s,
                reps: set.reps,
                loadKg: set.loadKg,
                rir: Value(set.rir),
                startedAtMs: Value(set.startedAt?.millisecondsSinceEpoch),
                endedAtMs: Value(set.endedAt?.millisecondsSinceEpoch),
              ),
            );
      }
    }
    return id;
  });

  @override
  Future<void> deleteWorkout(int id) => _db.transaction(() async {
    await _deleteChildren(id);
    await (_db.delete(_db.workouts)..where((t) => t.id.equals(id))).go();
  });

  static DateTime? _time(int? ms) =>
      ms == null ? null : DateTime.fromMillisecondsSinceEpoch(ms);

  Future<void> _deleteChildren(int workoutId) async {
    await (_db.delete(
      _db.workoutSets,
    )..where((t) => t.workoutId.equals(workoutId))).go();
    await (_db.delete(
      _db.workoutExercises,
    )..where((t) => t.workoutId.equals(workoutId))).go();
  }
}
