import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { TrendAnnouncement } from '../../src/engine/trends/TrendAnnouncement';
import type { TrendLogRepository } from '../../src/engine/trends/TrendLogRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `TrendLogRepository` must do (MM-605), in memory and in the database. */
export function trendLogRepositoryContract(
  name: string,
  create: () => TrendLogRepository | Promise<TrendLogRepository>,
): void {
  describe(`${name} as a TrendLogRepository`, () => {
    let repo: TrendLogRepository;
    const d1 = CalendarDate.of(2026, 10, 12);
    const d2 = CalendarDate.of(2026, 10, 20);
    const entry = (over: Partial<TrendAnnouncement> = {}): TrendAnnouncement => ({
      key: 'protein:level',
      transition: 'new',
      on: d1,
      direction: 'down',
      onsetDate: d1.addDays(-9),
      figures: { effect: -25.5, unit: 'g', n: 14, k: 11, span: 14, coverage: 0.857 },
      tier: 'clear',
      rulesVersion: 1,
      ...over,
    });
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchTrendAnnouncements())).toEqual([]);
      expect(await first(repo.watchFindingDismissals())).toEqual([]);
    });

    it('keeps every field of an entry as it was appended', async () => {
      const said = entry();
      const held = entry({
        key: 'fiber:drift',
        transition: 'held',
        direction: 'up',
        onsetDate: undefined,
        figures: { effect: 3, unit: 'g', n: 21, k: 18, span: 90, coverage: 0.6 },
        tier: 'strong',
        rulesVersion: 2,
      });
      await repo.appendTrendAnnouncements([said, held]);
      expect(await first(repo.watchTrendAnnouncements())).toEqual([said, held]);
    });

    it('lists the log oldest first, and entries of one day in the order appended', async () => {
      await repo.appendTrendAnnouncements([entry({ key: 'b:level', on: d2 })]);
      await repo.appendTrendAnnouncements([entry({ key: 'c:level', on: d1 }), entry({ key: 'a:level', on: d1 })]);
      await repo.appendTrendAnnouncements([entry({ key: 'd:level', on: d1, transition: 'continuing' })]);
      const log = await first(repo.watchTrendAnnouncements());
      expect(log.map((e) => e.key)).toEqual(['c:level', 'a:level', 'd:level', 'b:level']);
    });

    it('appending adds to the log and never replaces an entry of the same key', async () => {
      await repo.appendTrendAnnouncements([entry()]);
      await repo.appendTrendAnnouncements([entry({ transition: 'resolved', on: d2 })]);
      const log = await first(repo.watchTrendAnnouncements());
      expect(log.map((e) => e.transition)).toEqual(['new', 'resolved']);
    });

    it('appending nothing leaves the log as it was', async () => {
      await repo.appendTrendAnnouncements([entry()]);
      await repo.appendTrendAnnouncements([]);
      expect(await first(repo.watchTrendAnnouncements())).toHaveLength(1);
    });

    it('lists dismissals oldest first, once for each finding and day', async () => {
      await repo.dismissFinding('protein:level', d2);
      await repo.dismissFinding('day:fatAgainstTarget', d1);
      await repo.dismissFinding('protein:level', d2);
      await repo.dismissFinding('protein:level', d1);
      expect(await first(repo.watchFindingDismissals())).toEqual([
        { findingId: 'day:fatAgainstTarget', dismissedOn: d1 },
        { findingId: 'protein:level', dismissedOn: d1 },
        { findingId: 'protein:level', dismissedOn: d2 },
      ]);
    });

    it('a dismissal leaves the announcement log alone', async () => {
      await repo.appendTrendAnnouncements([entry()]);
      await repo.dismissFinding('protein:level', d2);
      expect(await first(repo.watchTrendAnnouncements())).toEqual([entry()]);
    });

    it('emits the current log first, then each change', async () => {
      await expectChangeEmits(repo.watchTrendAnnouncements(), {
        before: [],
        change: () => repo.appendTrendAnnouncements([entry()]),
        after: [entry()],
      });
      await expectChangeEmits(repo.watchFindingDismissals(), {
        before: [],
        change: () => repo.dismissFinding('protein:level', d1),
        after: [{ findingId: 'protein:level', dismissedOn: d1 }],
      });
    });
  });
}
