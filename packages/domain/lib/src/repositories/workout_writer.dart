import '../training/workout.dart';

/// Saves and deletes workouts (MM-75).
abstract interface class WorkoutWriter {
  /// Saves [workout] with its exercises and sets: a new one when its id is 0,
  /// otherwise a replacement of the one with that id. Returns its id.
  Future<int> saveWorkout(Workout workout);

  /// Removes the workout with [id] and its sets. Does nothing if there is
  /// none.
  Future<void> deleteWorkout(int id);
}
