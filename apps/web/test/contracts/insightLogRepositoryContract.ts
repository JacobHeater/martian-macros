import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { InsightLogRepository } from '../../src/engine/InsightLogRepository';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `InsightLogRepository` must do. */
export function insightLogRepositoryContract(
  name: string,
  create: () => InsightLogRepository | Promise<InsightLogRepository>,
): void {
  describe(`${name} as an InsightLogRepository`, () => {
    let repo: InsightLogRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 9);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchInsightLog())).toEqual([]);
    });

    it('lists what was shown, oldest first', async () => {
      await repo.recordInsightShown('stall', d2);
      await repo.recordInsightShown('proteinShort', d1);
      const log = await first(repo.watchInsightLog());
      expect(log.map((e) => e.rule)).toEqual(['proteinShort', 'stall']);
      expect(log[0]?.shownOn).toBe(d1);
      expect(log[0]?.dismissedOn).toBeUndefined();
    });

    it('dismissing marks the latest showing of that rule only', async () => {
      await repo.recordInsightShown('proteinShort', d1);
      await repo.recordInsightShown('stall', d1);
      await repo.recordInsightShown('proteinShort', d2);
      await repo.dismissInsight('proteinShort', d2.addDays(1));
      const log = await first(repo.watchInsightLog());
      const protein = log.filter((e) => e.rule === 'proteinShort');
      expect(protein.length).toBe(2);
      expect(protein[0]?.dismissedOn).toBeUndefined();
      expect(protein[1]?.dismissedOn).toBe(d2.addDays(1));
      expect(single(log.filter((e) => e.rule === 'stall')).dismissedOn).toBeUndefined();
    });

    it('dismissing a rule never shown does nothing', async () => {
      await repo.dismissInsight('stall', d1);
      expect(await first(repo.watchInsightLog())).toEqual([]);
    });
  });
}
