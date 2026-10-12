import 'package:mm_domain/mm_domain.dart';

/// A workout in a line (MM-75): "3 exercises · 9 sets · 55 min". The
/// duration is left out while it is in progress. With [records], the
/// personal records it set follow (MM-92): "· 1 personal record".
String workoutSummaryText(Workout workout, {int records = 0}) {
  final exercises = workout.exercises.length;
  final sets = workout.setCount;
  final ended = workout.endedAt;
  return [
    exercises == 1 ? '1 exercise' : '$exercises exercises',
    sets == 1 ? '1 set' : '$sets sets',
    if (ended != null) '${workout.activeFor(ended).inMinutes} min',
    if (records == 1) '1 personal record',
    if (records > 1) '$records personal records',
  ].join(' · ');
}
