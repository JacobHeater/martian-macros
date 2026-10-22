import { expect, it } from 'vitest';
import {
  CalendarDate,
  Exercise,
  HealthConnectSegment,
  type PlatformWorkout,
  type PlatformWorkoutSegment,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../src/domain';
import { platformWorkoutImports, workoutClientIdPrefix } from '../../src/engine';

/** MM-490: the platform's workouts brought into the log, each once. */
const base = new Date(2026, 9, 5, 18, 0);
const at = (minute: number) => new Date(base.getTime() + minute * 60 * 1000);
const benchPress = HealthConnectSegment.platformId('benchPress');
const punch = HealthConnectSegment.platformId('punch');

const segment = (segmentId: number, start: number, end: number, repetitions?: number): PlatformWorkoutSegment => ({
  segmentId,
  start: at(start),
  end: at(end),
  repetitions,
  weightKg: undefined,
});

const fromWatch = (platformId: string, segments: PlatformWorkoutSegment[] = [], { start = 0, end = 60 } = {}): PlatformWorkout => ({
  platformId,
  clientId: undefined,
  strength: true,
  start: at(start),
  end: at(end),
  segments,
  sourceId: 'com.example.watch',
  sourceName: 'Watch',
});

it('a workout on the platform is brought in once, with its platform id and source', () => {
  const [workout, ...rest] = platformWorkoutImports({
    platform: [fromWatch('hc-1', [segment(benchPress, 5, 6, 8)])],
    logged: [],
    deleted: new Set(),
  });
  expect(rest).toEqual([]);
  expect(workout?.id).toBe(0);
  expect(workout?.imported).toEqual({ platformId: 'hc-1', sourceName: 'Watch' });
  expect(workout?.date).toBe(CalendarDate.fromDate(base));
  expect(workout?.endedAt).toEqual(at(60));
  expect(workout?.exercises.map((e) => e.sets.map((s) => s.reps))).toEqual([[8]]);
});

it('An imported workout is not imported twice: read again, nothing is added', () => {
  const logged = new Workout({
    id: 4,
    date: CalendarDate.fromDate(base),
    startedAt: at(0),
    endedAt: at(60),
    exercises: [],
    imported: { platformId: 'hc-1', sourceName: 'Watch' },
  });
  expect(platformWorkoutImports({ platform: [fromWatch('hc-1'), fromWatch('hc-1')], logged: [logged], deleted: new Set() })).toEqual([]);
});

it('read again after it was moved on the platform, its span follows and its sets stay as the user has them', () => {
  const moved = new WorkoutExercise({ exerciseId: 'barbell-bench-press', sets: [new WorkoutSet({ reps: 8, loadKg: 80 })] });
  const logged = new Workout({
    id: 4,
    date: CalendarDate.fromDate(base),
    startedAt: at(0),
    endedAt: at(60),
    exercises: [moved],
    imported: { platformId: 'hc-1', sourceName: 'Watch' },
  });
  const [changed, ...rest] = platformWorkoutImports({
    platform: [fromWatch('hc-1', [segment(punch, 5, 6)], { start: 10, end: 75 })],
    logged: [logged],
    deleted: new Set(),
  });
  expect(rest).toEqual([]);
  expect(changed?.id).toBe(4);
  expect(changed?.startedAt).toEqual(at(10));
  expect(changed?.endedAt).toEqual(at(75));
  expect(changed?.exercises).toEqual([moved]);
  expect(changed?.imported?.platformId).toBe('hc-1');
});

it('one deleted in the app stays deleted, and one this app wrote is never brought in', () => {
  const written = { ...fromWatch('hc-3'), clientId: `${workoutClientIdPrefix}ns1-7` };
  expect(platformWorkoutImports({ platform: [fromWatch('hc-2'), written], logged: [], deleted: new Set(['hc-2']) })).toEqual([]);
});

it('a segment the library cannot place comes in as "Other exercise", with its time', () => {
  const [workout] = platformWorkoutImports({ platform: [fromWatch('hc-1', [segment(punch, 5, 7, 12)])], logged: [], deleted: new Set() });
  const [other] = workout?.exercises ?? [];
  expect(other?.exerciseId).toBe(Exercise.otherId);
  expect(other?.sets[0]?.startedAt).toEqual(at(5));
  expect(other?.sets[0]?.endedAt).toEqual(at(7));
});
