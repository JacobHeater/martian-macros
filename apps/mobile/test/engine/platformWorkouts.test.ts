import { describe, expect, it } from 'vitest';
import {
  builtInExercises,
  CalendarDate,
  Exercise,
  HealthConnectSegment,
  type PlatformWorkout,
  type PlatformWorkoutSegment,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../src/domain';
import {
  segmentExerciseId,
  workoutForPlatform,
  workoutFromPlatform,
  writeWorkoutToPlatform,
} from '../../src/engine';
import { InMemoryHealthWorkouts } from '../../src/fixtures/InMemoryHealthWorkouts';
import { NoHealthWorkouts } from '../../src/platform/NoHealthWorkouts';
import { healthWorkoutReaderContract } from '../contracts/healthWorkoutReaderContract';
import { healthWorkoutWriterContract } from '../contracts/healthWorkoutWriterContract';

/** MM-189: workouts that line up with the health platforms, with a fallback. */
const base = new Date(2026, 9, 5, 18, 0);
const at = (minute: number) => new Date(base.getTime() + minute * 60 * 1000);
const exerciseOf = (id: string) => builtInExercises.find((exercise) => exercise.id === id);
const benchPress = HealthConnectSegment.platformId('benchPress');

const timed = (start: number, end: number, reps = 8) =>
  new WorkoutSet({ reps, loadKg: 100, rir: 2, startedAt: at(start), endedAt: at(end) });

const finished = (exercises: WorkoutExercise[]) =>
  new Workout({ id: 7, date: CalendarDate.fromDate(base), startedAt: at(0), endedAt: at(60), exercises });

const segment = (segmentId: number, start: number, end: number, repetitions?: number): PlatformWorkoutSegment => ({
  segmentId,
  start: at(start),
  end: at(end),
  repetitions,
  weightKg: undefined,
});

const fromWatch = (segments: PlatformWorkoutSegment[], strength = true): PlatformWorkout => ({
  platformId: 'hc-1',
  clientId: undefined,
  strength,
  start: at(0),
  end: at(60),
  segments,
  sourceId: 'com.example.watch',
  sourceName: 'Watch',
});

const held: PlatformWorkout[] = [
  fromWatch([segment(benchPress, 5, 6, 8), segment(benchPress, 9, 10, 8)]),
  { ...fromWatch([], false), platformId: 'hc-2', start: at(24 * 60), end: at(24 * 60 + 30) },
];

healthWorkoutReaderContract('In-memory Health Connect', async () => new InMemoryHealthWorkouts({ namesExercises: true, held }));
healthWorkoutReaderContract('In-memory HealthKit', async () => new InMemoryHealthWorkouts({ namesExercises: false }));
healthWorkoutReaderContract('No health platform', async () => new NoHealthWorkouts());
healthWorkoutWriterContract('In-memory Health Connect', async () => new InMemoryHealthWorkouts({ namesExercises: true }));
healthWorkoutWriterContract('In-memory, writing refused', async () =>
  new InMemoryHealthWorkouts({ namesExercises: true, willPermitWrite: false }),
);
healthWorkoutWriterContract('No health platform', async () => new NoHealthWorkouts());

describe('the mapping', () => {
  it('every Health Connect segment type is found again by its platform id, and nothing else is', () => {
    for (const each of HealthConnectSegment.values) {
      expect(HealthConnectSegment.fromPlatformId(HealthConnectSegment.platformId(each))).toBe(each);
    }
    for (const notNamed of [0, 7, 38, 39, 44, 54, 99]) expect(HealthConnectSegment.fromPlatformId(notNamed)).toBeUndefined();
  });

  it('a segment imports as its movement anchor, a sided one as the exercise MM-188 names, and an unused one as nothing', () => {
    expect(segmentExerciseId(benchPress)).toBe('barbell-bench-press');
    expect(segmentExerciseId(HealthConnectSegment.platformId('squat'))).toBe('back-squat');
    expect(segmentExerciseId(HealthConnectSegment.platformId('dumbbellCurlLeftArm'))).toBe('dumbbell-curl');
    expect(segmentExerciseId(HealthConnectSegment.platformId('dumbbellTricepsExtensionRightArm'))).toBe(
      'dumbbell-overhead-triceps-extension',
    );
    expect(segmentExerciseId(HealthConnectSegment.platformId('punch'))).toBeUndefined();
    expect(segmentExerciseId(0)).toBeUndefined();
  });

  it('every segment the library uses comes back as an exercise that maps to it', () => {
    for (const exercise of builtInExercises) {
      const mapped = exercise.healthConnect;
      if (mapped === undefined) continue;
      const anchor = exerciseOf(segmentExerciseId(HealthConnectSegment.platformId(mapped)) ?? '');
      expect(anchor?.healthConnect, exercise.name).toBe(mapped);
    }
  });

  it('a custom exercise is never an anchor, even one the user said counts as a movement', () => {
    const own = new Exercise({
      id: `${Exercise.customIdPrefix}1`,
      name: 'My press',
      equipment: 'barbell',
      primary: 'chest',
      healthConnect: 'benchPress',
    });
    expect(segmentExerciseId(benchPress, [own, ...builtInExercises])).toBe('barbell-bench-press');
    expect(segmentExerciseId(benchPress, [own])).toBeUndefined();
  });
});

describe('writing a workout', () => {
  it('A movement the platform names: a bench press is written as its segment inside a strength session', () => {
    const written = workoutForPlatform(
      finished([new WorkoutExercise({ exerciseId: 'barbell-bench-press', sets: [timed(5, 6), timed(9, 10, 6)] })]),
      exerciseOf,
      { namesExercises: true },
    );
    expect(written).toEqual({
      clientId: 'martian-macros-workout-7',
      start: at(0),
      end: at(60),
      activeMs: 60 * 60 * 1000,
      segments: [segment(benchPress, 5, 6, 8), segment(benchPress, 9, 10, 6)],
    });
  });

  it('A movement it does not: the workout is still a session, and the exercise is not written as any other', () => {
    const workout = finished([
      new WorkoutExercise({ exerciseId: 'push-up', sets: [timed(5, 6, 20)] }),
      new WorkoutExercise({ exerciseId: 'barbell-bench-press', sets: [timed(9, 10)] }),
    ]);
    const written = workoutForPlatform(workout, exerciseOf, { namesExercises: true });
    expect(written?.start).toEqual(at(0));
    expect(written?.end).toEqual(at(60));
    expect(written?.segments).toEqual([segment(benchPress, 9, 10, 8)]);
    expect(workout.exercises.map((e) => e.exerciseId)).toEqual(['push-up', 'barbell-bench-press']);
  });

  it('iOS: on a platform that names no exercises the workout is a session only, and its sets stay in the app', () => {
    const workout = finished([new WorkoutExercise({ exerciseId: 'barbell-bench-press', sets: [timed(5, 6)] })]);
    expect(workoutForPlatform(workout, exerciseOf, { namesExercises: false })?.segments).toEqual([]);
    expect(workout.setCount).toBe(1);
  });

  it('a set without both its times, outside the workout, or overlapping one taken is left out; no time is invented', () => {
    const sets = [
      new WorkoutSet({ reps: 8, loadKg: 100, endedAt: at(3) }),
      new WorkoutSet({ reps: 8, loadKg: 100 }),
      timed(-5, -4),
      timed(10, 12),
      timed(11, 13),
    ];
    const written = workoutForPlatform(
      finished([new WorkoutExercise({ exerciseId: 'barbell-bench-press', sets })]),
      exerciseOf,
      { namesExercises: true },
    );
    expect(written?.segments).toEqual([segment(benchPress, 10, 12, 8)]);
  });

  it('an unsaved or unfinished workout is not written', () => {
    expect(workoutForPlatform(finished([]).copyWith({ id: 0 }), exerciseOf, { namesExercises: true })).toBeUndefined();
    expect(
      workoutForPlatform(finished([]).copyWith({ endedAt: undefined }), exerciseOf, { namesExercises: true }),
    ).toBeUndefined();
  });

  it('a paused workout keeps its span, and its active time leaves the pause out', () => {
    const written = workoutForPlatform(finished([]).copyWith({ pausedForMs: 10 * 60 * 1000 }), exerciseOf, {
      namesExercises: true,
    });
    expect(written?.activeMs).toBe(50 * 60 * 1000);
    expect(written?.end).toEqual(at(60));
  });

  it('Writing is separate permission: with reading granted and writing not, nothing is written', async () => {
    const platform = new InMemoryHealthWorkouts({ namesExercises: true, willPermitWrite: false });
    await platform.requestWritePermission();
    const workout = finished([new WorkoutExercise({ exerciseId: 'barbell-bench-press', sets: [timed(5, 6)] })]);
    expect(await writeWorkoutToPlatform(platform, workout, exerciseOf)).toBe(false);
    expect(platform.all).toEqual([]);
    expect(await writeWorkoutToPlatform(new NoHealthWorkouts(), workout, exerciseOf)).toBe(false);
  });

  it('once writing is granted the workout is written, and writing it again keeps one record', async () => {
    const platform = new InMemoryHealthWorkouts({ namesExercises: true });
    await platform.requestWritePermission();
    const workout = finished([new WorkoutExercise({ exerciseId: 'barbell-bench-press', sets: [timed(5, 6)] })]);
    expect(await writeWorkoutToPlatform(platform, workout, exerciseOf)).toBe(true);
    expect(await writeWorkoutToPlatform(platform, workout.copyWith({ endedAt: at(65) }), exerciseOf)).toBe(true);
    expect(platform.all).toHaveLength(1);
    expect(platform.all[0]?.end).toEqual(at(65));
    expect(platform.all[0]?.segments).toEqual([segment(benchPress, 5, 6, 8)]);
  });
});

describe('importing a workout', () => {
  it('Importing a workout with segments: a bench press segment of 8 becomes a bench press with a set of 8', () => {
    const workout = workoutFromPlatform(fromWatch([segment(benchPress, 5, 6, 8)]));
    expect(workout?.id).toBe(0);
    expect(workout?.startedAt).toEqual(at(0));
    expect(workout?.endedAt).toEqual(at(60));
    expect(workout?.exercises.map((e) => e.exerciseId)).toEqual(['barbell-bench-press']);
    const set = workout?.exercises[0]?.sets[0];
    expect(set?.reps).toBe(8);
    expect(set?.startedAt).toEqual(at(5));
    expect(set?.endedAt).toEqual(at(6));
    expect(set?.copyWith({ reps: 10 }).reps).toBe(10);
  });

  it('back-to-back segments of one movement are one exercise with its sets, in order', () => {
    const squat = HealthConnectSegment.platformId('squat');
    const workout = workoutFromPlatform(
      fromWatch([segment(squat, 20, 21, 5), segment(benchPress, 9, 10, 6), segment(benchPress, 5, 6, 8)]),
    );
    expect(workout?.exercises.map((e) => [e.exerciseId, e.sets.map((s) => s.reps)])).toEqual([
      ['barbell-bench-press', [8, 6]],
      ['back-squat', [5]],
    ]);
  });

  it('An unknown segment: it becomes "Other exercise" with its time, and nothing is lost', () => {
    const punch = HealthConnectSegment.platformId('punch');
    const workout = workoutFromPlatform(fromWatch([segment(punch, 5, 8), segment(0, 10, 12, 3)]));
    expect(workout?.exercises.map((e) => e.exerciseId)).toEqual([Exercise.otherId, Exercise.otherId]);
    expect(workout?.exercises[0]?.sets[0]?.startedAt).toEqual(at(5));
    expect(workout?.exercises[0]?.sets[0]?.endedAt).toEqual(at(8));
    expect(workout?.exercises[0]?.sets[0]?.reps).toBe(0);
    expect(workout?.exercises[1]?.sets[0]?.reps).toBe(3);
    expect(builtInExercises.some((e) => e.id === Exercise.otherId)).toBe(false);
  });

  it('a pause or a rest is not an exercise, and a weight the platform gave is kept', () => {
    const workout = workoutFromPlatform(
      fromWatch([segment(39, 1, 2), segment(44, 3, 4), { ...segment(benchPress, 5, 6, 8), weightKg: 80 }]),
    );
    expect(workout?.exercises.map((e) => e.exerciseId)).toEqual(['barbell-bench-press']);
    expect(workout?.exercises[0]?.sets[0]?.loadKg).toBe(80);
  });

  it('iOS, or any session that is not strength: a workout with its span and no exercises, which sets can be added to', () => {
    const workout = workoutFromPlatform(fromWatch([segment(benchPress, 5, 6, 8)], false));
    expect(workout?.exercises).toEqual([]);
    expect(workout?.activeMs(at(999))).toBe(60 * 60 * 1000);
    expect(workout?.date).toEqual(CalendarDate.fromDate(at(0)));
  });

  it('Not written twice: a workout the app wrote is not imported when the platform is read again', async () => {
    const platform = new InMemoryHealthWorkouts({ namesExercises: true, held: [fromWatch([])] });
    await platform.requestWritePermission();
    await writeWorkoutToPlatform(platform, finished([]), exerciseOf);
    const read = await platform.readWorkouts({ from: at(-60), to: at(120) });
    expect(read).toHaveLength(2);
    const imported = read.map((each) => workoutFromPlatform(each)).filter((each) => each !== undefined);
    expect(imported).toHaveLength(1);
    expect(imported[0]?.startedAt).toEqual(at(0));
  });
});
