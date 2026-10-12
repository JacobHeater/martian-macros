import { expect, it } from 'vitest';
import {
  builtInExercises,
  CalendarDate,
  Exercise,
  type MuscleGroup,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../src/domain';
import { buildWeeklyVolume, type WeeklyVolume } from '../../src/engine';
import { ArgumentError } from '../../src/lang/ArgumentError';
import { upTo } from '../support/upTo';
import { builtIn } from './support/builtIn';
import { only } from './support/only';

const today = CalendarDate.of(2026, 10, 11);
const bench = builtIn('barbell-bench-press');

function workout(
  age: number,
  {
    count = 1,
    rir,
    exerciseId,
    finished = true,
    load = 100,
  }: { count?: number; rir?: number; exerciseId?: string; finished?: boolean; load?: number } = {},
): Workout {
  const date = today.addDays(-age);
  const start = new Date(date.year, date.month - 1, date.day);
  return new Workout({
    id: 0,
    date,
    startedAt: start,
    endedAt: finished ? new Date(start.getTime() + 60 * 60 * 1000) : undefined,
    exercises: [
      new WorkoutExercise({
        exerciseId: exerciseId ?? bench.id,
        sets: upTo(count).map(() => new WorkoutSet({ reps: 10, loadKg: load, rir })),
      }),
    ],
  });
}

const build = (workouts: Workout[], exercises: readonly Exercise[] = builtInExercises) =>
  buildWeeklyVolume({ workouts, exercises, today });

const group = (value: WeeklyVolume, muscle: MuscleGroup) => only(value.groups.filter((v) => v.group === muscle));

it('four bench sets give four chest and two shoulders/triceps', () => {
  const volume = build([workout(0, { count: 4 })]);
  expect(group(volume, 'chest').currentSets).toBe(4);
  expect(group(volume, 'shoulders').currentSets).toBe(2);
  expect(group(volume, 'triceps').currentSets).toBe(2);
  expect(group(volume, 'hamstrings').currentSets).toBe(0);
  expect(volume.groups).toHaveLength(11);
});

it('rolling boundary, future and unfinished exclusion', () => {
  const volume = build([...[-1, 0, 6, 7, 13, 14].map((age) => workout(age)), workout(0, { finished: false })]);
  const chest = group(volume, 'chest');
  expect(chest.currentSets).toBe(2);
  expect(chest.previousSets).toBe(2);
  expect(chest.change).toBe(0);
});

it('RIR 4 and null count, RIR 5+ does not; bodyweight does not need weigh-in', () => {
  const volume = build([
    workout(0, { rir: 4 }),
    workout(0),
    workout(0, { rir: 5 }),
    workout(7, { exerciseId: 'pull-up', load: -20 }),
  ]);
  expect(group(volume, 'chest').currentSets).toBe(2);
  expect(group(volume, 'back').previousSets).toBe(1);
});

it('unknown mapping reported per window and only hard sets omitted', () => {
  const volume = build([
    workout(0, { exerciseId: 'custom-deleted', count: 3 }),
    workout(7, { exerciseId: 'custom-deleted', count: 2 }),
    workout(0, { exerciseId: 'custom-deleted', rir: 5 }),
  ]);
  expect(volume.unmappedCurrentSets).toBe(3);
  expect(volume.unmappedPreviousSets).toBe(2);
  expect(volume.groups.every((v) => v.currentSets === 0 && v.previousSets === 0)).toBe(true);
});

it('custom mappings, edits/deletions and duplicates recompute exactly', () => {
  const exercise = new Exercise({
    id: 'custom-one',
    name: 'Test',
    equipment: bench.equipment,
    primary: 'chest',
    secondary: ['chest', 'triceps', 'triceps'],
  });
  const volume = build([workout(0, { exerciseId: exercise.id, count: 3 })], [exercise]);
  expect(group(volume, 'chest').currentSets).toBe(3);
  expect(group(volume, 'triceps').currentSets).toBe(1.5);
  expect(group(build([]), 'chest').currentSets).toBe(0);
  expect(group(build([workout(0, { count: 30 })]), 'chest').currentSets).toBe(30);
});

it('malformed data is explicit error, not empty totals', () => {
  expect(() => build([workout(0, { load: Number.NaN })])).toThrow(ArgumentError);
  expect(() => build([workout(0, { rir: 6 })])).toThrow(ArgumentError);
});
