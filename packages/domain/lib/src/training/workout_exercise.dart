import 'workout_set.dart';

/// An exercise as done in one workout, with its sets in order (MM-75).
final class WorkoutExercise {
  const WorkoutExercise({required this.exerciseId, this.sets = const []});

  /// The [Exercise.id] of a built-in exercise or one of the user's own.
  final String exerciseId;
  final List<WorkoutSet> sets;

  WorkoutExercise withSets(List<WorkoutSet> sets) =>
      WorkoutExercise(exerciseId: exerciseId, sets: sets);
}
