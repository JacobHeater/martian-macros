import 'package:mm_domain/mm_domain.dart';

import 'muscle_volume.dart';
import 'weekly_volume.dart';

WeeklyVolume buildWeeklyVolume({
  required Iterable<Workout> workouts,
  required Iterable<Exercise> exercises,
  required CalendarDate today,
}) {
  final byId = {for (final exercise in exercises) exercise.id: exercise};
  final current = {for (final group in MuscleGroup.values) group: 0.0};
  final previous = {for (final group in MuscleGroup.values) group: 0.0};
  var unmappedCurrent = 0;
  var unmappedPrevious = 0;
  for (final workout in workouts) {
    final age = workout.date.daysUntil(today);
    if (workout.inProgress || age < 0 || age >= 14) continue;
    final totals = age < 7 ? current : previous;
    for (final entry in workout.exercises) {
      var hardSets = 0;
      for (final set in entry.sets) {
        if (set.reps < 1 ||
            !set.loadKg.isFinite ||
            (set.rir != null &&
                (set.rir! < 0 || set.rir! > WorkoutSet.maxRir))) {
          throw ArgumentError.value(set, 'set', 'Invalid reps, load or RIR.');
        }
        if (set.rir == null || set.rir! <= 4) hardSets++;
      }
      final exercise = byId[entry.exerciseId];
      if (exercise == null) {
        if (age < 7) {
          unmappedCurrent += hardSets;
        } else {
          unmappedPrevious += hardSets;
        }
        continue;
      }
      totals[exercise.primary] = totals[exercise.primary]! + hardSets;
      for (final secondary in exercise.secondary.toSet()) {
        if (secondary == exercise.primary) continue;
        totals[secondary] = totals[secondary]! + hardSets * 0.5;
      }
    }
  }
  return WeeklyVolume(
    today: today,
    groups: List.unmodifiable([
      for (final group in MuscleGroup.values)
        MuscleVolume(
          group: group,
          currentSets: current[group]!,
          previousSets: previous[group]!,
        ),
    ]),
    unmappedCurrentSets: unmappedCurrent,
    unmappedPreviousSets: unmappedPrevious,
  );
}
