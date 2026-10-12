import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WeightRepository } from '../../src/domain/repositories/WeightRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `WeightRepository` must do. */
export function weightRepositoryContract(name: string, create: () => WeightRepository | Promise<WeightRepository>): void {
  describe(`${name} as a WeightRepository`, () => {
    let repo: WeightRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 2);
    const d3 = CalendarDate.of(2026, 1, 3);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchWeights())).toEqual([]);
    });

    it('lists weigh-ins oldest first', async () => {
      await repo.saveWeight(d3, 82);
      await repo.saveWeight(d1, 80);
      await repo.saveWeight(d2, 81);
      const list = await first(repo.watchWeights());
      expect(list.map((w) => w.date.epochDay)).toEqual([d1.epochDay, d2.epochDay, d3.epochDay]);
      expect(list.map((w) => w.weightKg)).toEqual([80, 81, 82]);
    });

    it('keeps one weigh-in per day: saving again replaces it', async () => {
      await repo.saveWeight(d1, 80);
      await repo.saveWeight(d1, 79.4);
      expect(single(await first(repo.watchWeights())).weightKg).toBe(79.4);
    });

    it('deletes a weigh-in; deleting a missing day does nothing', async () => {
      await repo.saveWeight(d1, 80);
      await repo.deleteWeight(d2);
      expect((await first(repo.watchWeights())).length).toBe(1);
      await repo.deleteWeight(d1);
      expect(await first(repo.watchWeights())).toEqual([]);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchWeights(), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.saveWeight(d1, 80),
        after: 1,
      });
    });
  });
}
