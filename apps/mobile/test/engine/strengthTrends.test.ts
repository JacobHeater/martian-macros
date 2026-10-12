import { describe, expect, it } from 'vitest';
import { CalendarDate, type WeightObservation, Workout, WorkoutExercise, WorkoutSet } from '../../src/domain';
import { buildStrengthTrends, estimatedOneRepMax } from '../../src/engine';
import { ArgumentError } from '../../src/lang/ArgumentError';
import { expectClose } from '../support/expectClose';
import { builtIn } from './support/builtIn';
import { only } from './support/only';

const today = CalendarDate.of(2026, 10, 11);
const bench = builtIn('barbell-bench-press');
const pullUp = builtIn('pull-up');

function workout(
  id: number,
  daysAgo: number,
  sets: WorkoutSet[],
  { exerciseId, finished = true }: { exerciseId?: string; finished?: boolean } = {},
): Workout {
  const date = today.addDays(-daysAgo);
  const start = new Date(date.year, date.month - 1, date.day, 18);
  return new Workout({
    id,
    date,
    startedAt: start,
    endedAt: finished ? new Date(start.getTime() + 60 * 60 * 1000) : undefined,
    exercises: [new WorkoutExercise({ exerciseId: exerciseId ?? bench.id, sets })],
  });
}

const set = (load: number, { reps = 6, rir }: { reps?: number; rir?: number } = {}) =>
  new WorkoutSet({ reps, loadKg: load, rir });

const build = (workouts: Workout[], weights: WeightObservation[] = []) =>
  buildStrengthTrends({ workouts, exercises: [bench, pullUp], weights, today });

it('MM-194 deleted exercise retains logged sessions without guessing resistance', () => {
  const result = build([workout(1, 0, [set(100)], { exerciseId: 'custom-deleted' })]);
  expect(result).toHaveLength(1);
  expect(result[0]?.loggedSessions).toBe(1);
  expect(result[0]?.points).toEqual([]);
});

describe('Epley e1RM', () => {
  it('5 at 100 with 2 RIR is 123.3 kg, missing RIR is conservative', () => {
    expectClose(estimatedOneRepMax(set(100, { reps: 5, rir: 2 }), { load: bench.load }), 123.333333, 0.00001);
    expectClose(estimatedOneRepMax(set(100, { reps: 5 }), { load: bench.load }), 116.666667, 0.00001);
  });

  it('effective 12 counts, 13 and RIR 5+ do not', () => {
    expect(estimatedOneRepMax(set(100, { reps: 10, rir: 2 }), { load: bench.load })).toBe(140);
    expect(estimatedOneRepMax(set(100, { reps: 11, rir: 2 }), { load: bench.load })).toBeUndefined();
    expect(estimatedOneRepMax(set(100, { reps: 20 }), { load: bench.load })).toBeUndefined();
    expect(estimatedOneRepMax(set(100, { reps: 2, rir: 5 }), { load: bench.load })).toBeUndefined();
  });

  it('zero resistance and unknown bodyweight are not zero strength', () => {
    expect(estimatedOneRepMax(set(0), { load: bench.load })).toBeUndefined();
    expect(estimatedOneRepMax(set(10), { load: pullUp.load })).toBeUndefined();
    expect(estimatedOneRepMax(set(-80), { load: pullUp.load, bodyweightKg: 80 })).toBeUndefined();
    expectClose(
      estimatedOneRepMax(set(10, { reps: 5, rir: 2 }), { load: pullUp.load, bodyweightKg: 80 }),
      111,
      0.00001,
    );
    expectClose(
      estimatedOneRepMax(set(-20, { reps: 5, rir: 2 }), { load: pullUp.load, bodyweightKg: 80 }),
      74,
      0.00001,
    );
  });

  it('malformed inputs are explicit errors', () => {
    for (const value of [
      set(Number.NaN),
      set(Number.POSITIVE_INFINITY),
      set(10, { reps: 0 }),
      set(10, { rir: -1 }),
      set(10, { rir: 6 }),
    ]) {
      expect(() => estimatedOneRepMax(value, { load: bench.load })).toThrow(ArgumentError);
    }
    expect(() => estimatedOneRepMax(set(10), { load: pullUp.load, bodyweightKg: -1 })).toThrow(ArgumentError);
  });
});

it('session best combines every occurrence of the lift', () => {
  const session = workout(1, 0, [set(100), set(102.5), set(98)]).copyWith({
    exercises: [
      new WorkoutExercise({ exerciseId: bench.id, sets: [set(100), set(98)] }),
      new WorkoutExercise({ exerciseId: bench.id, sets: [set(102.5)] }),
    ],
  });
  const result = only(build([session]));
  const point = only(result.points);
  expect(point.estimateKg).toBe(123);
  expect(point.trendKg).toBe(123);
  expect(result.loggedSessions).toBe(1);
});

it('smoothing uses at most 3 sessions within 28 days; long gaps reset', () => {
  const result = only(
    build([
      workout(5, 0, [set(120)]),
      workout(3, 35, [set(100)]),
      workout(1, 49, [set(100)]),
      workout(4, 28, [set(90)]),
      workout(2, 42, [set(110)]),
    ]),
  );
  expect(result.points.map((p) => p.workoutId)).toEqual([1, 2, 3, 4, 5]);
  expect(result.points.map((p) => p.trendKg)).toEqual([120, 126, 124, 120, 126]);
  const afterGap = only(build([workout(1, 50, [set(100)]), workout(2, 0, [set(80)])]));
  expect(afterGap.points[afterGap.points.length - 1]?.trendKg).toBe(96);
});

it('4 and 12 week changes use smoothed baselines, not guessed points', () => {
  const points = [
    workout(1, 98, [set(100 / 1.2)]),
    workout(2, 91, [set(100 / 1.2)]),
    workout(3, 84, [set(100 / 1.2)]),
    workout(4, 42, [set(100 / 1.2)]),
    workout(5, 35, [set(100 / 1.2)]),
    workout(6, 28, [set(100 / 1.2)]),
    workout(7, 14, [set(106 / 1.2)]),
    workout(8, 7, [set(106 / 1.2)]),
    workout(9, 0, [set(106 / 1.2)]),
  ];
  const trend = only(build(points));
  expectClose(trend.changeOverDays(28), 6, 0.00001);
  expectClose(trend.changeOverDays(84), 6, 0.00001);
  expect(only(build([workout(1, 0, [set(100)])])).changeOverDays(28)).toBeUndefined();
  expect(
    only(build([workout(1, 36, [set(100)]), workout(2, 0, [set(100)])])).changeOverDays(28),
  ).toBeUndefined();
  expectClose(
    only(build([workout(1, 35, [set(100)]), workout(2, 0, [set(100)])])).changeOverDays(28),
    0,
    0.00001,
  );
  expect(() => trend.changeOverDays(0)).toThrow(ArgumentError);
});

it('bodyweight uses only a recent historical reading and recomputes corrections', () => {
  const sessions = [
    workout(1, 20, [set(10, { reps: 5, rir: 2 })], { exerciseId: pullUp.id }),
    workout(2, 0, [set(-20)], { exerciseId: pullUp.id }),
  ];
  let result = only(
    build(sessions, [
      { date: today.addDays(-27), weightKg: 80 },
      { date: today.addDays(-19), weightKg: 100 },
    ]),
  );
  expectClose(only(result.points).estimateKg, 111, 0.00001);
  expect(result.loggedSessions).toBe(2);
  result = only(
    build(sessions, [
      { date: today.addDays(-20), weightKg: 90 },
      { date: today, weightKg: 80 },
    ]),
  );
  expectClose(result.points[0]?.estimateKg, 123.333333, 0.00001);
  expect(result.points[result.points.length - 1]?.estimateKg).toBe(72);
  expect(only(build(sessions, [{ date: today.addDays(-28), weightKg: 80 }])).points).toEqual([]);
});

it('in-progress/future/empty sessions do not count, unusable lifts stay accessible', () => {
  const result = only(
    build([
      workout(1, 0, [set(100)], { finished: false }),
      workout(2, -1, [set(100)]),
      workout(3, 0, []),
      workout(4, 0, [set(100, { reps: 20 })]),
    ]),
  );
  expect(result.points).toEqual([]);
  expect(result.loggedSessions).toBe(1);
  expect(result.recentSessions).toBe(0);
});

it('ranking is deterministic; duplicate dates retain separate sessions', () => {
  const result = build(
    [
      workout(4, 0, [set(100)], { exerciseId: pullUp.id }),
      workout(2, 1, [set(100)], { exerciseId: pullUp.id }),
      workout(3, 0, [set(80)]),
      workout(1, 0, [set(100)]),
      workout(5, 90, [set(100)]),
    ],
    [{ date: today.addDays(-1), weightKg: 80 }],
  );
  expect(result.map((r) => r.exerciseId)).toEqual([bench.id, pullUp.id]);
  const first = result[0];
  expect(first?.recentSessions).toBe(2);
  expect(first?.points.map((p) => p.workoutId)).toEqual([5, 1, 3]);
  expect(first?.points[2]?.date).toBe(first?.points[1]?.date);
  expect(build([])).toEqual([]);
  expect(only(build([workout(1, 0, [set(100)])])).points).toHaveLength(1);
  expect(only(only(build([workout(1, 0, [set(80)])])).points).estimateKg).toBe(96);
});
