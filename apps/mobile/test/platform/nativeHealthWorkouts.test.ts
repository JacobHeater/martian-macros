import { expect, it } from 'vitest';
import { NativeHealthWorkouts } from '../../src/platform/NativeHealthWorkouts';
import type { MmHealthWorkout } from '../../src/platform/MmHealthWorkout';
import { healthWorkoutReaderContract } from '../contracts/healthWorkoutReaderContract';
import { healthWorkoutWriterContract } from '../contracts/healthWorkoutWriterContract';
import { fakeMmHealthWrites } from '../support/fakeMmHealthWrites';

/** MM-489: the workouts adapter the phone uses, with the plugin stood in for. */
const base = new Date(2026, 9, 5, 18, 0).getTime();
const minute = (n: number) => base + n * 60 * 1000;

const fromWatch: MmHealthWorkout = {
  id: 'hc-watch-1',
  clientId: '',
  strength: true,
  startMs: minute(0),
  endMs: minute(60),
  sourceId: 'com.example.watch',
  sourceName: 'Watch',
  // Out of order, as a platform may hand them over, and one outside the workout.
  segments: [
    { segmentId: 5, startMs: minute(9), endMs: minute(10), repetitions: 8 },
    { segmentId: 5, startMs: minute(5), endMs: minute(6), repetitions: 8 },
    { segmentId: 51, startMs: minute(59), endMs: minute(61) },
  ],
};
const walk: MmHealthWorkout = {
  id: 'hc-walk-1',
  clientId: 'com.other.app-7',
  strength: false,
  startMs: minute(24 * 60),
  endMs: minute(24 * 60 + 30),
  sourceId: 'com.other.app',
  sourceName: 'Other app',
  segments: [],
};

const android = (options: Parameters<typeof fakeMmHealthWrites>[0] = {}) => {
  const fake = fakeMmHealthWrites({ workouts: [fromWatch, walk], ...options });
  return { fake, workouts: new NativeHealthWorkouts({ api: fake.api, namesExercises: true }) };
};

healthWorkoutReaderContract('Health Connect workouts (bridge stood in for)', async () => android().workouts);
healthWorkoutWriterContract('Health Connect workouts (bridge stood in for)', async () => android().workouts);
healthWorkoutWriterContract(
  'Apple Health workouts (bridge stood in for)',
  async () => new NativeHealthWorkouts({ api: fakeMmHealthWrites().api, namesExercises: false }),
);
healthWorkoutWriterContract('Health Connect workouts, writing refused', async () => android({ grants: [] }).workouts);

const workout = {
  clientId: 'martian-macros-workout-7',
  start: new Date(minute(0)),
  end: new Date(minute(60)),
  activeMs: 60 * 60 * 1000,
  segments: [
    { segmentId: 5, start: new Date(minute(5)), end: new Date(minute(6)), repetitions: 8, weightKg: undefined },
  ],
};

it('a workout is read with its segments, oldest first, inside it; its writer is said (MM-489)', async () => {
  const [watch, other] = await android().workouts.readWorkouts({ from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) });
  expect(watch?.clientId).toBeUndefined();
  expect(watch?.segments.map((s) => s.start.getTime())).toEqual([minute(5), minute(9)]);
  expect(watch?.segments[0]?.repetitions).toBe(8);
  expect(other?.strength).toBe(false);
  expect(other?.clientId).toBe('com.other.app-7');
});

it('nothing is read while reading workouts is not allowed (MM-489)', async () => {
  const { workouts } = android({ readsWorkouts: false });
  expect(await workouts.readWorkouts({ from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) })).toEqual([]);
});

it('Writing asks for its own permission: with reading granted, nothing is written until writing is (MM-489)', async () => {
  const { fake, workouts } = android();
  expect(await workouts.writeWorkout(workout)).toBe(false);
  expect(fake.workouts.has('hc-martian-macros-workout-7')).toBe(false);
  expect(await workouts.requestWritePermission()).toBe(true);
  expect(fake.asked()).toEqual(['workouts']);
  expect(await workouts.writeWorkout(workout)).toBe(true);
});

it('Written once: a workout edited and written again is one workout on the platform (MM-489)', async () => {
  const { fake, workouts } = android();
  await workouts.requestWritePermission();
  await workouts.writeWorkout(workout);
  await workouts.writeWorkout({ ...workout, end: new Date(minute(65)) });
  const ours = [...fake.workouts.values()].filter((w) => w.clientId === workout.clientId);
  expect(ours).toHaveLength(1);
  expect(ours[0]?.endMs).toBe(minute(65));
  expect(ours[0]?.segments).toEqual([{ segmentId: 5, startMs: minute(5), endMs: minute(6), repetitions: 8 }]);
});

it('Apple Health is given the session alone (MM-489)', async () => {
  const fake = fakeMmHealthWrites();
  const workouts = new NativeHealthWorkouts({ api: fake.api, namesExercises: false });
  await workouts.requestWritePermission();
  await workouts.writeWorkout(workout);
  expect(fake.workouts.get('hc-martian-macros-workout-7')?.segments).toEqual([]);
});
