import 'package:mm_domain/mm_domain.dart';

import 'observable_value.dart';

/// [WorkoutRepository] held in memory. Ids count up from 1 and are never
/// reused.
final class InMemoryWorkoutRepository implements WorkoutRepository {
  final _workouts = ObservableValue<List<Workout>>(const []);
  var _nextId = 1;

  @override
  Stream<List<Workout>> watchWorkouts() => _workouts.watch().map(
    (all) => [...all]
      ..sort((a, b) {
        final byStart = b.startedAt.compareTo(a.startedAt);
        return byStart != 0 ? byStart : b.id.compareTo(a.id);
      }),
  );

  @override
  Future<int> saveWorkout(Workout workout) async {
    if (workout.id == 0) {
      final id = _nextId++;
      _workouts.value = [..._workouts.value, workout.copyWith(id: id)];
      return id;
    }
    _workouts.value = [
      for (final existing in _workouts.value)
        existing.id == workout.id ? workout : existing,
    ];
    return workout.id;
  }

  @override
  Future<void> deleteWorkout(int id) async {
    _workouts.value = [
      for (final existing in _workouts.value)
        if (existing.id != id) existing,
    ];
  }

  /// Empties the store (used by [InMemoryDataEraser]). Ids keep counting, as
  /// in the database.
  void clear() => _workouts.value = const [];
}
