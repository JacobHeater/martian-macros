import 'package:mm_domain/mm_domain.dart';

/// When the current rest began (MM-191): the end of the most recently ended
/// set of [workout]. Null before any set has an end. The rest is not stored;
/// it is the gap between one set's end and the next one's start.
DateTime? restStartedAt(Workout workout) {
  DateTime? latest;
  for (final exercise in workout.exercises) {
    for (final set in exercise.sets) {
      final end = set.endedAt;
      if (end != null && (latest == null || end.isAfter(latest))) latest = end;
    }
  }
  return latest;
}
