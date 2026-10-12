import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
import { RecoveryQuestion } from '../../src/domain/RecoveryQuestion';
import type { RecoveryCheckInRepository } from '../../src/domain/repositories/RecoveryCheckInRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `RecoveryCheckInRepository` must do. */
export function recoveryCheckInRepositoryContract(
  name: string,
  create: () => RecoveryCheckInRepository | Promise<RecoveryCheckInRepository>,
): void {
  describe(`${name} as a RecoveryCheckInRepository`, () => {
    let repo: RecoveryCheckInRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 8);
    const checkIn = (date: CalendarDate, { hunger = 3 }: { hunger?: number } = {}) =>
      new RecoveryCheckIn({ date, hunger, energy: 2, sleep: 4, training: 5, mood: 1 });

    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchRecoveryCheckIns())).toEqual([]);
    });

    it('keeps every answer, and sleep hours when given', async () => {
      await repo.saveRecoveryCheckIn(
        new RecoveryCheckIn({ date: d1, hunger: 1, energy: 2, sleep: 3, training: 4, mood: 5, sleepHours: 6.5 }),
      );
      const saved = single(await first(repo.watchRecoveryCheckIns()));
      expect(RecoveryQuestion.values.map((q) => saved.answer(q))).toEqual([1, 2, 3, 4, 5]);
      expect(saved.sleepHours).toBe(6.5);
      expect(saved.date).toBe(d1);
    });

    it('sleep hours are absent unless given', async () => {
      await repo.saveRecoveryCheckIn(checkIn(d1));
      expect(single(await first(repo.watchRecoveryCheckIns())).sleepHours).toBeUndefined();
    });

    it('lists oldest first; one per day, the later answer wins', async () => {
      await repo.saveRecoveryCheckIn(checkIn(d2));
      await repo.saveRecoveryCheckIn(checkIn(d1));
      await repo.saveRecoveryCheckIn(checkIn(d1, { hunger: 5 }));
      const saved = await first(repo.watchRecoveryCheckIns());
      expect(saved.map((c) => c.date)).toEqual([d1, d2]);
      expect(saved[0]?.hunger).toBe(5);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchRecoveryCheckIns(), {
        see: (all) => all.length,
        before: 0,
        change: () => repo.saveRecoveryCheckIn(checkIn(d1)),
        after: 1,
      });
    });
  });
}
