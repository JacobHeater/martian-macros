import 'package:mm_domain/mm_domain.dart';

/// A workout in a line (MM-75): "3 exercises · 9 sets · 55 min". The
/// duration is left out while it is in progress.
String workoutSummaryText(Workout workout) {
  final exercises = workout.exercises.length;
  final sets = workout.setCount;
  final ended = workout.endedAt;
  return [
    exercises == 1 ? '1 exercise' : '$exercises exercises',
    sets == 1 ? '1 set' : '$sets sets',
    if (ended != null) '${ended.difference(workout.startedAt).inMinutes} min',
  ].join(' · ');
}
