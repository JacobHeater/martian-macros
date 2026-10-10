import 'package:mm_domain/mm_domain.dart';

/// The exercises the user has done, most recently used first, each once
/// (MM-76). Within one workout they keep the order they were done in.
List<String> recentExerciseIds(Iterable<Workout> workouts) {
  final newestFirst = [...workouts]
    ..sort((a, b) => b.startedAt.compareTo(a.startedAt));
  final seen = <String>{};
  return [
    for (final workout in newestFirst)
      for (final exercise in workout.exercises)
        if (seen.add(exercise.exerciseId)) exercise.exerciseId,
  ];
}
