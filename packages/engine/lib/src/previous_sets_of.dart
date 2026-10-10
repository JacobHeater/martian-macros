import 'package:mm_domain/mm_domain.dart';

/// What was done last time (MM-75): the sets of [exerciseId] in the most
/// recent workout started before [before] that has any. Empty if it has never
/// been logged before then.
List<WorkoutSet> previousSetsOf({
  required String exerciseId,
  required Iterable<Workout> workouts,
  required DateTime before,
}) {
  final earlier = [
    for (final workout in workouts)
      if (workout.startedAt.isBefore(before)) workout,
  ]..sort((a, b) => b.startedAt.compareTo(a.startedAt));
  for (final workout in earlier) {
    final sets = [
      for (final exercise in workout.exercises)
        if (exercise.exerciseId == exerciseId) ...exercise.sets,
    ];
    if (sets.isNotEmpty) return sets;
  }
  return const [];
}
