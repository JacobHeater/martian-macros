import { beforeEach, describe, expect, it } from 'vitest';
import type { HealthWorkoutReader } from '../../src/domain/integration/HealthWorkoutReader';
import type { PlatformWorkout } from '../../src/domain/training/PlatformWorkout';

/**
 * What every `HealthWorkoutReader` must do (MM-189). `create` gives a
 * reader the user has let read workouts, with whatever workouts it holds;
 * the suite assumes none in particular.
 */
export function healthWorkoutReaderContract(name: string, create: () => Promise<HealthWorkoutReader>): void {
  describe(`${name} reads health workouts`, () => {
    let reader: HealthWorkoutReader;
    const longAgo = new Date(2000, 0, 1);
    const farAhead = new Date(2100, 0, 1);

    beforeEach(async () => {
      reader = await create();
    });

    it('workouts come oldest first, within the range, each with an id of its own, a source and a span', async () => {
      const workouts = await reader.readWorkouts({ from: longAgo, to: farAhead });
      expect(new Set(workouts.map((w) => w.platformId)).size).toBe(workouts.length);
      workouts.forEach((workout, i) => {
        expect(workout.platformId).not.toBe('');
        expect(workout.sourceId).not.toBe('');
        expect(workout.end.getTime()).toBeGreaterThanOrEqual(workout.start.getTime());
        expect(workout.start.getTime()).toBeGreaterThanOrEqual(longAgo.getTime());
        expect(workout.start.getTime()).toBeLessThan(farAhead.getTime());
        const before = workouts[i - 1];
        if (before !== undefined) expect(workout.start.getTime()).toBeGreaterThanOrEqual(before.start.getTime());
      });
    });

    it('each segment lies inside its workout, ends after it starts, and they come oldest first', async () => {
      for (const workout of await reader.readWorkouts({ from: longAgo, to: farAhead })) {
        workout.segments.forEach((segment, i) => {
          expect(segment.end.getTime()).toBeGreaterThan(segment.start.getTime());
          expect(segment.start.getTime()).toBeGreaterThanOrEqual(workout.start.getTime());
          expect(segment.end.getTime()).toBeLessThanOrEqual(workout.end.getTime());
          if (segment.repetitions !== undefined) expect(segment.repetitions).toBeGreaterThanOrEqual(0);
          const before = workout.segments[i - 1];
          if (before !== undefined) expect(segment.start.getTime()).toBeGreaterThanOrEqual(before.start.getTime());
        });
      }
    });

    it('the end of a range is not in it, and an empty range is empty', async () => {
      const all = await reader.readWorkouts({ from: longAgo, to: farAhead });
      const earliest: PlatformWorkout | undefined = all[0];
      if (earliest === undefined) return;
      expect(await reader.readWorkouts({ from: longAgo, to: earliest.start })).toEqual([]);
      expect((await reader.readWorkouts({ from: earliest.start, to: farAhead }))[0]).toEqual(earliest);
      expect(await reader.readWorkouts({ from: earliest.start, to: earliest.start })).toEqual([]);
    });
  });
}
