import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WorkoutRepository } from '../../src/domain/repositories/WorkoutRepository';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

const secondMs = 1000;
const minuteMs = 60 * secondMs;
const hourMs = 60 * minuteMs;
const dayMs = 24 * hourMs;

const later = (from: Date, ms: number) => new Date(from.getTime() + ms);
const set = (reps: number, loadKg: number, rir?: number) => new WorkoutSet({ reps, loadKg, rir });
const squats = (...sets: WorkoutSet[]) => new WorkoutExercise({ exerciseId: 'back-squat', sets });

/** What every `WorkoutRepository` must do (MM-75). */
export function workoutRepositoryContract(
  name: string,
  create: () => WorkoutRepository | Promise<WorkoutRepository>,
): void {
  describe(`${name} as a WorkoutRepository`, () => {
    let repo: WorkoutRepository;
    const day = CalendarDate.of(2026, 10, 5);
    const six = new Date(2026, 9, 5, 18);
    const workout = ({
      id = 0,
      startedAt,
      endedAt,
      exercises = [],
    }: {
      id?: number;
      startedAt?: Date;
      endedAt?: Date;
      exercises?: readonly WorkoutExercise[];
    } = {}) => new Workout({ id, date: day, startedAt: startedAt ?? six, endedAt, exercises });

    beforeEach(async () => {
      repo = await create();
    });

    const onlyWorkout = async () => single(await first(repo.watchWorkouts()));

    it('starts empty', async () => {
      expect(await first(repo.watchWorkouts())).toEqual([]);
    });

    it('a saved workout is read back with every field', async () => {
      const id = await repo.saveWorkout(
        workout({
          endedAt: later(six, 55 * minuteMs),
          exercises: [
            squats(set(8, 100, 2), set(7, 102.5)),
            new WorkoutExercise({ exerciseId: 'pull-up', sets: [set(6, -20, 0)], restTargetMs: 150 * secondMs }),
          ],
        }),
      );
      expect(id).toBeGreaterThan(0);
      const read = await onlyWorkout();
      expect(read.exercises[0]?.restTargetMs).toBeUndefined();
      expect(read.exercises[1]?.restTargetMs).toBe(150 * secondMs);
      expect(read.id).toBe(id);
      expect(read.date).toBe(day);
      expect(read.startedAt.getTime()).toBe(six.getTime());
      expect(read.endedAt?.getTime()).toBe(six.getTime() + 55 * minuteMs);
      expect(read.inProgress).toBe(false);
      expect(read.exercises.map((e) => e.exerciseId)).toEqual(['back-squat', 'pull-up']);
      const squat = read.exercises[0]?.sets ?? [];
      expect(squat.map((s) => s.reps)).toEqual([8, 7]);
      expect(squat.map((s) => s.loadKg)).toEqual([100, 102.5]);
      expect(squat.map((s) => s.rir)).toEqual([2, undefined]);
      const pullUp = single(read.exercises[1]?.sets ?? []);
      expect(pullUp.loadKg).toBe(-20);
      expect(pullUp.rir).toBe(0);
    });

    it('set times and the running set timer are kept', async () => {
      const start = later(six, 3 * minuteMs);
      const end = later(start, 42 * secondMs);
      const timing = later(end, 2 * minuteMs);
      await repo.saveWorkout(
        new Workout({
          id: 0,
          date: day,
          startedAt: six,
          setStartedAt: timing,
          exercises: [
            squats(
              new WorkoutSet({ reps: 8, loadKg: 100, startedAt: start, endedAt: end }),
              new WorkoutSet({ reps: 8, loadKg: 100, endedAt: end }),
              new WorkoutSet({ reps: 8, loadKg: 100 }),
            ),
          ],
        }),
      );
      const read = await onlyWorkout();
      expect(read.setStartedAt?.getTime()).toBe(timing.getTime());
      const sets = single(read.exercises).sets;
      expect(sets[0]?.startedAt?.getTime()).toBe(start.getTime());
      expect(sets[0]?.endedAt?.getTime()).toBe(end.getTime());
      expect(sets[0]?.durationMs).toBe(42 * secondMs);
      expect(sets[1]?.startedAt).toBeUndefined();
      expect(sets[1]?.endedAt?.getTime()).toBe(end.getTime());
      expect(sets[1]?.durationMs).toBeUndefined();
      expect(sets[2]?.startedAt).toBeUndefined();
      expect(sets[2]?.endedAt).toBeUndefined();
    });

    it('a pause, running or over, is kept', async () => {
      const pausedAt = later(six, 20 * minuteMs);
      await repo.saveWorkout(
        new Workout({ id: 0, date: day, startedAt: six, pausedAt, pausedForMs: 4 * minuteMs + 30 * secondMs }),
      );
      const read = await onlyWorkout();
      expect(read.paused).toBe(true);
      expect(read.pausedAt?.getTime()).toBe(pausedAt.getTime());
      expect(read.pausedForMs).toBe(4 * minuteMs + 30 * secondMs);
      // Twenty minutes on the wall, less the earlier pause; the clock is
      // stopped, so the time now does not matter.
      expect(read.activeMs(later(six, 3 * hourMs))).toBe(15 * minuteMs + 30 * secondMs);
    });

    it('a workout in progress has no end', async () => {
      await repo.saveWorkout(workout());
      const read = await onlyWorkout();
      expect(read.endedAt).toBeUndefined();
      expect(read.paused).toBe(false);
      expect(read.pausedForMs).toBe(0);
      expect(read.setStartedAt).toBeUndefined();
      expect(read.inProgress).toBe(true);
    });

    it('an exercise with no sets yet is kept, in its place', async () => {
      await repo.saveWorkout(
        workout({
          exercises: [
            new WorkoutExercise({ exerciseId: 'back-squat' }),
            new WorkoutExercise({ exerciseId: 'leg-press', sets: [set(10, 180)] }),
            new WorkoutExercise({ exerciseId: 'leg-curl' }),
          ],
        }),
      );
      const read = await onlyWorkout();
      expect(read.exercises.map((e) => e.exerciseId)).toEqual(['back-squat', 'leg-press', 'leg-curl']);
      expect(read.exercises.map((e) => e.sets.length)).toEqual([0, 1, 0]);
    });

    it('the same exercise twice in a workout stays two entries', async () => {
      await repo.saveWorkout(workout({ exercises: [squats(set(5, 120)), squats(set(12, 80))] }));
      const read = await onlyWorkout();
      expect(read.exercises.length).toBe(2);
      expect(single(read.exercises[0]?.sets ?? []).reps).toBe(5);
      expect(single(read.exercises[1]?.sets ?? []).reps).toBe(12);
    });

    it('saving with an id replaces that workout and its sets', async () => {
      const id = await repo.saveWorkout(workout({ exercises: [squats(set(8, 100), set(8, 100))] }));
      const same = await repo.saveWorkout(
        workout({
          id,
          endedAt: later(six, hourMs),
          exercises: [new WorkoutExercise({ exerciseId: 'front-squat', sets: [set(5, 90, 1)] })],
        }),
      );
      expect(same).toBe(id);
      const only = await onlyWorkout();
      expect(only.inProgress).toBe(false);
      expect(single(only.exercises).exerciseId).toBe('front-squat');
      expect(only.setCount).toBe(1);
    });

    it('lists workouts most recently started first', async () => {
      const older = await repo.saveWorkout(workout({ startedAt: later(six, -2 * dayMs) }));
      const newer = await repo.saveWorkout(workout());
      expect((await first(repo.watchWorkouts())).map((w) => w.id)).toEqual([newer, older]);
    });

    it('ids are not reused after a delete', async () => {
      const firstId = await repo.saveWorkout(workout());
      await repo.deleteWorkout(firstId);
      expect(await repo.saveWorkout(workout())).toBeGreaterThan(firstId);
    });

    it('deletes a workout with its sets; a missing one is ignored', async () => {
      const keep = await repo.saveWorkout(workout({ exercises: [squats(set(8, 100))] }));
      const gone = await repo.saveWorkout(
        workout({ exercises: [new WorkoutExercise({ exerciseId: 'pull-up', sets: [set(6, 0)] })] }),
      );
      await repo.deleteWorkout(gone);
      await repo.deleteWorkout(gone + 100);
      const only = await onlyWorkout();
      expect(only.id).toBe(keep);
      expect(single(only.exercises).exerciseId).toBe('back-squat');
      expect(only.setCount).toBe(1);
    });

    // MM-490: an imported workout keeps where it came from through a change; deleting it remembers its platform id.
    it('an imported workout keeps its platform id and source, through a change', async () => {
      const imported = { platformId: 'hc-1', sourceName: 'Watch' };
      const id = await repo.saveWorkout(
        new Workout({ id: 0, date: day, startedAt: six, endedAt: later(six, hourMs), exercises: [squats(set(8, 100))], imported }),
      );
      expect((await onlyWorkout()).imported).toEqual(imported);
      await repo.saveWorkout((await onlyWorkout()).copyWith({ exercises: [squats(set(10, 100))] }));
      const changed = await onlyWorkout();
      expect(changed.id).toBe(id);
      expect(changed.imported).toEqual(imported);
      expect(single(changed.exercises).sets[0]?.reps).toBe(10);
    });

    it('a workout logged in the app has no platform id', async () => {
      await repo.saveWorkout(workout({ endedAt: later(six, hourMs) }));
      expect((await onlyWorkout()).imported).toBeUndefined();
    });

    it('deleting an imported workout remembers its platform id; deleting one logged in the app does not', async () => {
      expect(await repo.deletedPlatformIds()).toEqual(new Set());
      const own = await repo.saveWorkout(workout({ endedAt: later(six, hourMs) }));
      const imported = await repo.saveWorkout(
        new Workout({ id: 0, date: day, startedAt: later(six, dayMs), endedAt: later(six, dayMs + hourMs), imported: { platformId: 'hc-2', sourceName: 'Watch' } }),
      );
      await repo.deleteWorkout(own);
      await repo.deleteWorkout(imported);
      expect(await first(repo.watchWorkouts())).toEqual([]);
      expect(await repo.deletedPlatformIds()).toEqual(new Set(['hc-2']));
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchWorkouts(), {
        see: (all) => all.length,
        before: 0,
        change: () => repo.saveWorkout(workout()),
        after: 1,
      });
    });

    it('emits when only a set changes', async () => {
      const id = await repo.saveWorkout(workout({ exercises: [squats(set(8, 100))] }));
      await expectChangeEmits(repo.watchWorkouts(), {
        see: (all) => all[0]?.setCount,
        before: 1,
        change: () => repo.saveWorkout(workout({ id, exercises: [squats(set(8, 100), set(8, 100))] })),
        after: 2,
      });
    });
  });
}
