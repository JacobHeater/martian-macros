import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { DayKindRepository } from '../../src/domain/repositories/DayKindRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `DayKindRepository` must do (MM-611), in memory and in the database. */
export function dayKindRepositoryContract(
  name: string,
  create: () => DayKindRepository | Promise<DayKindRepository>,
): void {
  describe(`${name} as a DayKindRepository`, () => {
    let repo: DayKindRepository;
    const d1 = CalendarDate.of(2026, 10, 18);
    const d2 = CalendarDate.of(2026, 10, 19);
    beforeEach(async () => {
      repo = await create();
    });

    it('a day never marked has no mark', async () => {
      expect(await first(repo.watchDayKind(d1))).toBe('none');
      expect(await first(repo.watchMarkedDays())).toEqual(new Map());
    });

    it('a mark applies to its day only and can be changed', async () => {
      await repo.setDayKind(d1, 'refeed');
      expect(await first(repo.watchDayKind(d1))).toBe('refeed');
      expect(await first(repo.watchDayKind(d2))).toBe('none');
      await repo.setDayKind(d1, 'dayOff');
      expect(await first(repo.watchDayKind(d1))).toBe('dayOff');
    });

    it('clearing a mark leaves the day unmarked and out of the marked days', async () => {
      await repo.setDayKind(d1, 'dayOff');
      await repo.setDayKind(d2, 'refeed');
      await repo.setDayKind(d1, 'none');
      expect(await first(repo.watchDayKind(d1))).toBe('none');
      expect(await first(repo.watchMarkedDays())).toEqual(new Map([[d2.epochDay, 'refeed']]));
      // Clearing a day with no mark is harmless.
      await repo.setDayKind(d1, 'none');
      expect(await first(repo.watchDayKind(d1))).toBe('none');
    });

    it('lists every marked day by its epoch day', async () => {
      await repo.setDayKind(d2, 'dayOff');
      await repo.setDayKind(d1, 'refeed');
      expect(await first(repo.watchMarkedDays())).toEqual(
        new Map([
          [d1.epochDay, 'refeed'],
          [d2.epochDay, 'dayOff'],
        ]),
      );
    });

    it('emits the current mark first, then each change', async () => {
      await expectChangeEmits(repo.watchDayKind(d1), {
        before: 'none',
        change: () => repo.setDayKind(d1, 'refeed'),
        after: 'refeed',
      });
    });
  });
}
