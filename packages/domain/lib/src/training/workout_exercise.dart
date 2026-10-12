import 'workout_set.dart';

/// An exercise as done in one workout, with its sets in order (MM-75).
final class WorkoutExercise {
  const WorkoutExercise({
    required this.exerciseId,
    this.sets = const [],
    this.restTarget,
  });

  /// The [Exercise.id] of a built-in exercise or one of the user's own.
  final String exerciseId;
  final List<WorkoutSet> sets;

  /// How long the user means to rest after a set of this exercise, if they
  /// chose a length (MM-191). The rest timer counts down to it.
  final Duration? restTarget;

  WorkoutExercise withSets(List<WorkoutSet> sets) => WorkoutExercise(
    exerciseId: exerciseId,
    sets: sets,
    restTarget: restTarget,
  );

  WorkoutExercise withRestTarget(Duration? restTarget) => WorkoutExercise(
    exerciseId: exerciseId,
    sets: sets,
    restTarget: restTarget,
  );
}
