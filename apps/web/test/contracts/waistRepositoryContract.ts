import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WaistRepository } from '../../src/domain/repositories/WaistRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `WaistRepository` must do. */
export function waistRepositoryContract(name: string, create: () => WaistRepository | Promise<WaistRepository>): void {
  describe(`${name} as a WaistRepository`, () => {
    let repo: WaistRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 8);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchWaist())).toEqual([]);
    });

    it('lists measurements oldest first and replaces a day', async () => {
      await repo.saveWaist(d2, 90);
      await repo.saveWaist(d1, 92);
      await repo.saveWaist(d1, 91.5);
      const list = await first(repo.watchWaist());
      expect(list.map((w) => w.date.epochDay)).toEqual([d1.epochDay, d2.epochDay]);
      expect(list.map((w) => w.waistCm)).toEqual([91.5, 90]);
    });

    it('the readings a measurement was taken from are kept in order', async () => {
      await repo.saveWaist(d1, 92, { readings: [91.5, 92.5, 92] });
      await repo.saveWaist(d2, 90.5, { readings: [90.5] });
      const list = await first(repo.watchWaist());
      expect(list[0]?.waistCm).toBe(92);
      expect(list[0]?.readings).toEqual([91.5, 92.5, 92]);
      expect(list[0]?.isSingleReading).toBe(false);
      expect(list[1]?.readings).toEqual([90.5]);
      expect(list[1]?.isSingleReading).toBe(true);
    });

    it('a measurement saved without readings has none, and saving the day again replaces its readings', async () => {
      await repo.saveWaist(d1, 92, { readings: [91.5, 92.5, 92] });
      await repo.saveWaist(d1, 91);
      const only = single(await first(repo.watchWaist()));
      expect(only.waistCm).toBe(91);
      expect(only.readings).toEqual([]);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchWaist(), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.saveWaist(d1, 92),
        after: 1,
      });
    });
  });
}
