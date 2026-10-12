import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { DayMarkRepository } from '../../src/domain/repositories/DayMarkRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `DayMarkRepository` must do. */
export function dayMarkRepositoryContract(
  name: string,
  create: () => DayMarkRepository | Promise<DayMarkRepository>,
): void {
  describe(`${name} as a DayMarkRepository`, () => {
    let repo: DayMarkRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 2);
    beforeEach(async () => {
      repo = await create();
    });

    it('an unmarked day is unmarked', async () => {
      expect(await first(repo.watchCompleteness(d1))).toBe('unmarked');
    });

    it('a mark applies to its day only and can be changed', async () => {
      await repo.setCompleteness(d1, 'complete');
      expect(await first(repo.watchCompleteness(d1))).toBe('complete');
      expect(await first(repo.watchCompleteness(d2))).toBe('unmarked');
      await repo.setCompleteness(d1, 'partial');
      expect(await first(repo.watchCompleteness(d1))).toBe('partial');
    });

    it('emits the current mark first, then each change', async () => {
      await expectChangeEmits(repo.watchCompleteness(d1), {
        before: 'unmarked',
        change: () => repo.setCompleteness(d1, 'complete'),
        after: 'complete',
      });
    });
  });
}
