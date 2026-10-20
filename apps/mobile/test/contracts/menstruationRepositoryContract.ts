import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { MenstruationRepository } from '../../src/domain/repositories/MenstruationRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `MenstruationRepository` must do (MM-20). */
export function menstruationRepositoryContract(
  name: string,
  create: () => MenstruationRepository | Promise<MenstruationRepository>,
): void {
  describe(`${name} as a MenstruationRepository`, () => {
    let repo: MenstruationRepository;
    const d1 = CalendarDate.of(2026, 3, 1);
    const d2 = CalendarDate.of(2026, 3, 2);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchFlowDays())).toEqual([]);
    });

    it('lists flow days oldest first, marks a day once, and unmarks it', async () => {
      await repo.markFlowDay(d2);
      await repo.markFlowDay(d1);
      await repo.markFlowDay(d1);
      expect((await first(repo.watchFlowDays())).map((d) => d.date)).toEqual([d1, d2]);
      await repo.unmarkFlowDay(d1);
      await repo.unmarkFlowDay(d1);
      expect((await first(repo.watchFlowDays())).map((d) => d.date)).toEqual([d2]);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchFlowDays(), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.markFlowDay(d1),
        after: 1,
      });
    });
  });
}
