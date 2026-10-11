import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:test/test.dart';

void main() {
  final today = CalendarDate(2026, 10, 11);
  final bench = builtInExercises.firstWhere(
    (e) => e.id == 'barbell-bench-press',
  );
  Workout workout(
    int age, {
    int count = 1,
    int? rir,
    String? exerciseId,
    bool finished = true,
    double load = 100,
  }) {
    final date = today.addDays(-age);
    final start = DateTime(date.year, date.month, date.day);
    return Workout(
      id: 0,
      date: date,
      startedAt: start,
      endedAt: finished ? start.add(const Duration(hours: 1)) : null,
      exercises: [
        WorkoutExercise(
          exerciseId: exerciseId ?? bench.id,
          sets: [
            for (var i = 0; i < count; i++)
              WorkoutSet(reps: 10, loadKg: load, rir: rir),
          ],
        ),
      ],
    );
  }

  WeeklyVolume build(List<Workout> workouts, {List<Exercise>? exercises}) =>
      buildWeeklyVolume(
        workouts: workouts,
        exercises: exercises ?? builtInExercises,
        today: today,
      );
  MuscleVolume group(WeeklyVolume value, MuscleGroup muscle) =>
      value.groups.singleWhere((v) => v.group == muscle);

  test('four bench sets give four chest and two shoulders/triceps', () {
    final volume = build([workout(0, count: 4)]);
    expect(group(volume, MuscleGroup.chest).currentSets, 4);
    expect(group(volume, MuscleGroup.shoulders).currentSets, 2);
    expect(group(volume, MuscleGroup.triceps).currentSets, 2);
    expect(group(volume, MuscleGroup.hamstrings).currentSets, 0);
    expect(volume.groups, hasLength(11));
  });
  test('rolling boundary, future and unfinished exclusion', () {
    final volume = build([
      for (final age in [-1, 0, 6, 7, 13, 14]) workout(age),
      workout(0, finished: false),
    ]);
    final chest = group(volume, MuscleGroup.chest);
    expect(chest.currentSets, 2);
    expect(chest.previousSets, 2);
    expect(chest.change, 0);
  });
  test(
    'RIR 4 and null count, RIR 5+ does not; bodyweight does not need weigh-in',
    () {
      final volume = build([
        workout(0, rir: 4),
        workout(0),
        workout(0, rir: 5),
        workout(7, exerciseId: 'pull-up', load: -20),
      ]);
      expect(group(volume, MuscleGroup.chest).currentSets, 2);
      expect(group(volume, MuscleGroup.back).previousSets, 1);
    },
  );
  test('unknown mapping reported per window and only hard sets omitted', () {
    final volume = build([
      workout(0, exerciseId: 'custom-deleted', count: 3),
      workout(7, exerciseId: 'custom-deleted', count: 2),
      workout(0, exerciseId: 'custom-deleted', rir: 5),
    ]);
    expect(volume.unmappedCurrentSets, 3);
    expect(volume.unmappedPreviousSets, 2);
    expect(
      volume.groups.every((v) => v.currentSets == 0 && v.previousSets == 0),
      isTrue,
    );
  });
  test('custom mappings, edits/deletions and duplicates recompute exactly', () {
    final exercise = Exercise(
      id: 'custom-one',
      name: 'Test',
      equipment: bench.equipment,
      primary: MuscleGroup.chest,
      secondary: [MuscleGroup.chest, MuscleGroup.triceps, MuscleGroup.triceps],
    );
    final volume = build(
      [workout(0, exerciseId: exercise.id, count: 3)],
      exercises: [exercise],
    );
    expect(group(volume, MuscleGroup.chest).currentSets, 3);
    expect(group(volume, MuscleGroup.triceps).currentSets, 1.5);
    expect(group(build([]), MuscleGroup.chest).currentSets, 0);
    expect(
      group(build([workout(0, count: 30)]), MuscleGroup.chest).currentSets,
      30,
    );
  });
  test('malformed data is explicit error, not empty totals', () {
    expect(() => build([workout(0, load: double.nan)]), throwsArgumentError);
    expect(() => build([workout(0, rir: 6)]), throwsArgumentError);
  });
}
