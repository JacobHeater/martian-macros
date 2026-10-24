import { expect, it } from 'vitest';
import {
  builtInExercises,
  CalendarDate,
  HealthConnectSegment,
  type PlatformWorkout,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../src/domain';
import { buildStrengthTrends, buildWeeklyVolume, volumeJumpInsights, workoutFromPlatform } from '../../src/engine';
import { only } from './support/only';

/**
 * MM-613: a set imported without repetitions (MM-189 gives it 0 reps, for
 * the user to edit) is evidence of nothing. Weekly volume, the volume jump
 * and strength trends load, and the set counts toward none of them.
 */
const today = CalendarDate.of(2026, 10, 5);
const exercisesById = new Map(builtInExercises.map((e) => [e.id, e]));
const bench = 'barbell-bench-press';
const at = (minute: number) => new Date(2026, 9, 5, 18, minute);

/** A strength session on a watch today: a punch and ten bench press segments, none with repetitions or weight. */
const fromWatch: PlatformWorkout = {
  platformId: 'hc-1',
  clientId: undefined,
  strength: true,
  start: at(0),
  end: at(50),
  segments: [
    { segmentId: HealthConnectSegment.platformId('punch'), start: at(1), end: at(2), repetitions: undefined, weightKg: undefined },
    ...Array.from({ length: 10 }, (_, k) => ({
      segmentId: HealthConnectSegment.platformId('benchPress'),
      start: at(4 + 4 * k),
      end: at(5 + 4 * k),
      repetitions: undefined,
      weightKg: undefined,
    })),
  ],
  sourceId: 'com.example.watch',
  sourceName: 'Watch',
};

const imported = (): Workout => {
  const workout = workoutFromPlatform(fromWatch);
  if (workout === undefined) throw new Error('The session was not imported.');
  return workout.copyWith({ id: 100 });
};

/** The imported workout once the user has edited every set to 8 reps of 60 kg. */
const edited = (workout: Workout): Workout =>
  workout.copyWith({
    exercises: workout.exercises.map((entry) => entry.withSets(entry.sets.map((set) => set.copyWith({ reps: 8, loadKg: 60 })))),
  });

let nextId = 1;

/** Four bench press sets of 8 in each of the four weeks before today: a usual week of 4 chest sets. */
const usualWeeks = (): Workout[] =>
  [1, 2, 3, 4].map((week) => {
    const date = today.addDays(-7 * week);
    const startedAt = new Date(date.year, date.month - 1, date.day, 18);
    return new Workout({
      id: nextId++,
      date,
      startedAt,
      endedAt: new Date(startedAt.getTime() + 50 * 60 * 1000),
      exercises: [
        new WorkoutExercise({ exerciseId: bench, sets: Array.from({ length: 4 }, () => new WorkoutSet({ reps: 8, loadKg: 60 })) }),
      ],
    });
  });

const chest = (workout: Workout) =>
  only(buildWeeklyVolume({ workouts: [workout], exercises: builtInExercises, today }).groups.filter((v) => v.group === 'chest'));

it('the import keeps the sets without reps, for the user to edit', () => {
  const workout = imported();
  expect(workout.exercises.map((e) => e.exerciseId)).toEqual(['other-exercise', bench]);
  expect(workout.exercises[1]?.sets.map((s) => s.reps)).toEqual(Array.from({ length: 10 }, () => 0));
});

it('weekly volume loads, and a set without reps counts toward no group', () => {
  const volume = buildWeeklyVolume({ workouts: [imported()], exercises: builtInExercises, today });
  expect(volume.groups.every((group) => group.currentSets === 0 && group.previousSets === 0)).toBe(true);
  expect(volume.unmappedCurrentSets).toBe(0);
});

it('the volume jump loads, and sets without reps make no jump', () => {
  const workout = imported();
  expect(volumeJumpInsights({ workout, workouts: [...usualWeeks(), workout], exercisesById, pauses: [] })).toEqual([]);
});

it('strength trends load, and a session of sets without reps is no session of the lift', () => {
  const trends = buildStrengthTrends({ workouts: [imported()], exercises: builtInExercises, weights: [], today });
  expect(trends.find((trend) => trend.exerciseId === bench)).toBeUndefined();
});

it('once edited to 8 reps, the sets count as any other', () => {
  const workout = edited(imported());
  expect(chest(workout).currentSets).toBe(10);
  const [jump, ...rest] = volumeJumpInsights({ workout, workouts: [...usualWeeks(), workout], exercisesById, pauses: [] });
  expect(rest).toEqual([]);
  expect(jump?.figures).toMatchObject({ weekSets: 10, usualSets: 4 });
  const trend = only(
    buildStrengthTrends({ workouts: [workout], exercises: builtInExercises, weights: [], today }).filter(
      (t) => t.exerciseId === bench,
    ),
  );
  expect(trend.loggedSessions).toBe(1);
  expect(trend.points).toHaveLength(1);
});
