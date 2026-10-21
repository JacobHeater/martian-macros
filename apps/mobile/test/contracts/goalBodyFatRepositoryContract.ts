import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalBodyFatRepository } from '../../src/domain/repositories/GoalBodyFatRepository';
import { first } from '../support/first';

/** What every `GoalBodyFatRepository` must do (MM-36). */
export function goalBodyFatRepositoryContract(
  name: string,
  create: () => GoalBodyFatRepository | Promise<GoalBodyFatRepository>,
): void {
  describe(`${name} as a GoalBodyFatRepository`, () => {
    let repo: GoalBodyFatRepository;
    const day = CalendarDate.of(2026, 10, 21);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts with no goal', async () => {
      expect(await first(repo.watchGoalBodyFat())).toBeUndefined();
    });

    it('keeps the latest goal, with the day it was set', async () => {
      await repo.saveGoalBodyFat({ percent: 15, setOn: day });
      await repo.saveGoalBodyFat({ percent: 12.5, setOn: day.addDays(3) });
      expect(await first(repo.watchGoalBodyFat())).toEqual({ percent: 12.5, setOn: day.addDays(3) });
    });

    it('a cleared goal is gone, and clearing none is harmless', async () => {
      await repo.saveGoalBodyFat({ percent: 15, setOn: day });
      await repo.clearGoalBodyFat();
      expect(await first(repo.watchGoalBodyFat())).toBeUndefined();
      await repo.clearGoalBodyFat();
      expect(await first(repo.watchGoalBodyFat())).toBeUndefined();
    });
  });
}
