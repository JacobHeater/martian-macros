import 'package:mm_domain/mm_domain.dart';

/// The rest the user means to take now (MM-191): the target of the exercise
/// whose set ended most recently in [workout]. Null when no set has ended
/// or that exercise has no target.
Duration? restTargetOf(Workout workout) {
  DateTime? latest;
  Duration? target;
  for (final exercise in workout.exercises) {
    for (final set in exercise.sets) {
      final end = set.endedAt;
      if (end != null && (latest == null || end.isAfter(latest))) {
        latest = end;
        target = exercise.restTarget;
      }
    }
  }
  return target;
}
