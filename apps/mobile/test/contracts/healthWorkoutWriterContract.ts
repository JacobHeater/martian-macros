import { beforeEach, describe, expect, it } from 'vitest';
import type { HealthWorkoutWriter } from '../../src/domain/integration/HealthWorkoutWriter';
import type { WorkoutForPlatform } from '../../src/domain/training/WorkoutForPlatform';

/**
 * What every `HealthWorkoutWriter` must do (MM-189, MM-515). `create` gives a
 * writer the user has not yet let write workouts: writing is a permission
 * of its own and off until it is granted.
 */
export function healthWorkoutWriterContract(name: string, create: () => Promise<HealthWorkoutWriter>): void {
  describe(`${name} writes health workouts`, () => {
    let writer: HealthWorkoutWriter;
    const workout: WorkoutForPlatform = {
      clientId: 'martian-macros-workout-1',
      start: new Date(2026, 9, 5, 18, 0),
      end: new Date(2026, 9, 5, 19, 0),
      activeMs: 60 * 60 * 1000,
      segments: [],
    };

    beforeEach(async () => {
      writer = await create();
    });

    it('writes nothing while writing is not permitted', async () => {
      expect(await writer.writePermitted()).toBe(false);
      expect(await writer.writeWorkout(workout)).toBe(false);
    });

    it('removes nothing while writing is not permitted (MM-515)', async () => {
      expect(await writer.removeWorkout(workout.clientId)).toBe(false);
    });

    it('once permitted, a workout written is removed under its own id (MM-515)', async () => {
      if (!(await writer.requestWritePermission())) return;
      expect(await writer.writeWorkout(workout)).toBe(true);
      expect(await writer.removeWorkout(workout.clientId)).toBe(true);
    });

    it('asking answers what is permitted afterwards', async () => {
      const answer = await writer.requestWritePermission();
      expect(await writer.writePermitted()).toBe(answer);
    });

    it('once permitted, a workout can be written, and written again under its own id', async () => {
      if (!(await writer.requestWritePermission())) return;
      expect(await writer.writeWorkout(workout)).toBe(true);
      expect(await writer.writeWorkout({ ...workout, end: new Date(2026, 9, 5, 19, 5) })).toBe(true);
    });
  });
}
