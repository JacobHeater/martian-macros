import '../training/workout.dart';

/// Reads logged workouts (MM-75).
abstract interface class WorkoutReader {
  /// Every workout, most recently started first, then the full list after
  /// each change.
  Stream<List<Workout>> watchWorkouts();
}
