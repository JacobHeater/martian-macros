import { beforeEach, describe, expect, it } from 'vitest';
import type { ExerciseProgressionRepository } from '../../src/domain/repositories/ExerciseProgressionRepository';
import { ExerciseProgression } from '../../src/domain/training/ExerciseProgression';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `ExerciseProgressionRepository` must do (MM-79). */
export function exerciseProgressionRepositoryContract(
  name: string,
  create: () => ExerciseProgressionRepository | Promise<ExerciseProgressionRepository>,
): void {
  describe(`${name} as an ExerciseProgressionRepository`, () => {
    let repo: ExerciseProgressionRepository;
    const squat = new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 3, repsHigh: 6, loadStepKg: 5 });
    const curl = new ExerciseProgression({ exerciseId: 'custom-1', repsLow: 10, repsHigh: 15 });

    /** As `equals` sees them, so an implementation need not hand back the same objects. */
    const expectSame = (read: readonly ExerciseProgression[], expected: readonly ExerciseProgression[]) => {
      expect(read.length).toBe(expected.length);
      read.forEach((progression, i) => {
        expect(progression.equals(expected[i] as ExerciseProgression), `entry ${i}`).toBe(true);
      });
    };

    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchExerciseProgressions())).toEqual([]);
    });

    it('what is saved is read back with every field, by exercise id', async () => {
      await repo.saveExerciseProgression(curl);
      await repo.saveExerciseProgression(squat);
      expectSame(await first(repo.watchExerciseProgressions()), [squat, curl]);
    });

    it('saving for the same exercise again replaces it', async () => {
      await repo.saveExerciseProgression(squat);
      const changed = new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 5, repsHigh: 8 });
      await repo.saveExerciseProgression(changed);
      const only = single(await first(repo.watchExerciseProgressions()));
      expect(only.equals(changed)).toBe(true);
      expect(only.loadStepKg).toBeUndefined();
    });

    it('clearing goes back to none for that exercise only, and clearing what is not set does nothing', async () => {
      await repo.saveExerciseProgression(squat);
      await repo.saveExerciseProgression(curl);
      await repo.clearExerciseProgression('back-squat');
      await repo.clearExerciseProgression('never-set');
      expectSame(await first(repo.watchExerciseProgressions()), [curl]);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchExerciseProgressions(), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.saveExerciseProgression(squat),
        after: 1,
      });
    });
  });
}
