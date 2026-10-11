import 'package:mm_domain/mm_domain.dart';

/// The rest target the user last had for an exercise (MM-191): from the
/// most recently started of [workouts] that has the exercise, so a target
/// chosen once is there the next time. Null when that one had none.
Duration? lastRestTargetOf({
  required String exerciseId,
  required Iterable<Workout> workouts,
}) {
  Workout? latest;
  for (final workout in workouts) {
    if (!workout.exercises.any((e) => e.exerciseId == exerciseId)) continue;
    if (latest == null || workout.startedAt.isAfter(latest.startedAt)) {
      latest = workout;
    }
  }
  return latest?.exercises
      .lastWhere((e) => e.exerciseId == exerciseId)
      .restTarget;
}
