import { beforeEach, describe, expect, it } from 'vitest';
import type { CustomExerciseRepository } from '../../src/domain/repositories/CustomExerciseRepository';
import { Exercise } from '../../src/domain/training/Exercise';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `CustomExerciseRepository` must do (MM-76). */
export function customExerciseRepositoryContract(
  name: string,
  create: () => CustomExerciseRepository | Promise<CustomExerciseRepository>,
): void {
  describe(`${name} as a CustomExerciseRepository`, () => {
    let repo: CustomExerciseRepository;
    const exercise = (exerciseName: string, { id = '' }: { id?: string } = {}) =>
      new Exercise({ id, name: exerciseName, equipment: 'barbell', primary: 'shoulders' });

    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchCustomExercises())).toEqual([]);
    });

    it('a saved exercise is read back with every field', async () => {
      const id = await repo.saveCustomExercise(
        new Exercise({
          id: '',
          name: 'Ring dip',
          equipment: 'other',
          primary: 'chest',
          secondary: ['triceps', 'shoulders'],
          load: 'bodyweight',
        }),
      );
      expect(id.startsWith(Exercise.customIdPrefix)).toBe(true);
      const read = single(await first(repo.watchCustomExercises()));
      expect(read.id).toBe(id);
      expect(read.isCustom).toBe(true);
      expect(read.name).toBe('Ring dip');
      expect(read.equipment).toBe('other');
      expect(read.primary).toBe('chest');
      expect(read.secondary).toEqual(['triceps', 'shoulders']);
      expect(read.load).toBe('bodyweight');
      expect(read.healthConnect).toBeUndefined();
    });

    it('an exercise with no secondary muscle groups has none', async () => {
      await repo.saveCustomExercise(exercise('Landmine press'));
      const read = single(await first(repo.watchCustomExercises()));
      expect(read.secondary).toEqual([]);
      expect(read.load).toBe('addedWeight');
    });

    it('lists by name, whatever the capitals', async () => {
      await repo.saveCustomExercise(exercise('landmine press'));
      await repo.saveCustomExercise(exercise('Zercher squat'));
      await repo.saveCustomExercise(exercise('Atlas stone'));
      expect((await first(repo.watchCustomExercises())).map((e) => e.name)).toEqual([
        'Atlas stone',
        'landmine press',
        'Zercher squat',
      ]);
    });

    it('each new exercise gets its own id', async () => {
      const a = await repo.saveCustomExercise(exercise('A'));
      const b = await repo.saveCustomExercise(exercise('B'));
      expect(a).not.toBe(b);
    });

    it('saving with an id replaces that exercise', async () => {
      const id = await repo.saveCustomExercise(exercise('Landmine pres'));
      const same = await repo.saveCustomExercise(exercise('Landmine press', { id }));
      expect(same).toBe(id);
      const only = single(await first(repo.watchCustomExercises()));
      expect(only.name).toBe('Landmine press');
      expect(only.id).toBe(id);
    });

    it('ids are not reused after a delete', async () => {
      const firstId = await repo.saveCustomExercise(exercise('A'));
      await repo.deleteCustomExercise(firstId);
      expect(await repo.saveCustomExercise(exercise('B'))).not.toBe(firstId);
    });

    it('deletes an exercise; a missing one is ignored', async () => {
      const keep = await repo.saveCustomExercise(exercise('A'));
      const gone = await repo.saveCustomExercise(exercise('B'));
      await repo.deleteCustomExercise(gone);
      await repo.deleteCustomExercise(`${Exercise.customIdPrefix}9999`);
      await repo.deleteCustomExercise('back-squat');
      expect(single(await first(repo.watchCustomExercises())).id).toBe(keep);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchCustomExercises(), {
        see: (all) => all.length,
        before: 0,
        change: () => repo.saveCustomExercise(exercise('A')),
        after: 1,
      });
    });
  });
}
