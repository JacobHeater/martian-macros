import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { DailyStepsRepository } from '../../src/domain/repositories/DailyStepsRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `DailyStepsRepository` must do (MM-677), in memory and in the database. */
export function dailyStepsRepositoryContract(
  name: string,
  create: () => DailyStepsRepository | Promise<DailyStepsRepository>,
): void {
  describe(`${name} as a DailyStepsRepository`, () => {
    let repo: DailyStepsRepository;
    const d1 = CalendarDate.of(2026, 10, 4);
    const d2 = CalendarDate.of(2026, 10, 5);

    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchDailySteps())).toEqual([]);
    });

    it('a day saved is read back, oldest first, whatever the order saved', async () => {
      await repo.saveDailySteps([
        { date: d2, steps: 6100 },
        { date: d1, steps: 8400 },
      ]);
      expect(await first(repo.watchDailySteps())).toEqual([
        { date: d1, steps: 8400 },
        { date: d2, steps: 6100 },
      ]);
    });

    it("a day saved again replaces the day's total", async () => {
      await repo.saveDailySteps([{ date: d1, steps: 8400 }]);
      await repo.saveDailySteps([{ date: d1, steps: 9000 }]);
      expect(await first(repo.watchDailySteps())).toEqual([{ date: d1, steps: 9000 }]);
    });

    it('a day with no steps above zero is not kept', async () => {
      await repo.saveDailySteps([
        { date: d1, steps: 0 },
        { date: d2, steps: 12 },
      ]);
      expect(await first(repo.watchDailySteps())).toEqual([{ date: d2, steps: 12 }]);
    });

    it('emits what is kept first, then each change', async () => {
      await expectChangeEmits(repo.watchDailySteps(), {
        before: [],
        change: () => repo.saveDailySteps([{ date: d1, steps: 8400 }]),
        after: [{ date: d1, steps: 8400 }],
      });
    });
  });
}
