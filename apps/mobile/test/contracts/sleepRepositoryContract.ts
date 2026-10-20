import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { SleepRepository } from '../../src/domain/repositories/SleepRepository';
import { SleepNight } from '../../src/domain/SleepNight';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `SleepRepository` must do (MM-250). */
export function sleepRepositoryContract(name: string, create: () => SleepRepository | Promise<SleepRepository>): void {
  describe(`${name} as a SleepRepository`, () => {
    let repo: SleepRepository;
    const d1 = CalendarDate.of(2026, 10, 1);
    const d2 = CalendarDate.of(2026, 10, 2);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchSleepNights())).toEqual([]);
    });

    it('lists nights oldest first, one per day, and saving a day again replaces it', async () => {
      await repo.saveSleepNight(new SleepNight({ date: d2, minutesAsleep: 390, source: 'imported', sourceName: 'Watch' }));
      await repo.saveSleepNight(new SleepNight({ date: d1, minutesAsleep: 420, source: 'typed' }));
      await repo.saveSleepNight(new SleepNight({ date: d1, minutesAsleep: 440, source: 'typed' }));
      const nights = await first(repo.watchSleepNights());
      expect(nights.map((n) => n.date)).toEqual([d1, d2]);
      expect(nights.map((n) => n.minutesAsleep)).toEqual([440, 390]);
      expect(nights.map((n) => n.source)).toEqual(['typed', 'imported']);
    });

    it('keeps the source and its name, and a typed night has no name', async () => {
      await repo.saveSleepNight(new SleepNight({ date: d1, minutesAsleep: 400, source: 'imported', sourceName: 'Watch' }));
      const imported = single(await first(repo.watchSleepNights()));
      expect(imported.sourceName).toBe('Watch');
      await repo.saveSleepNight(new SleepNight({ date: d1, minutesAsleep: 440, source: 'typed' }));
      const typed = single(await first(repo.watchSleepNights()));
      expect(typed.source).toBe('typed');
      expect(typed.sourceName).toBeUndefined();
      expect(typed.equals(new SleepNight({ date: d1, minutesAsleep: 440, source: 'typed' }))).toBe(true);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchSleepNights(), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.saveSleepNight(new SleepNight({ date: d1, minutesAsleep: 420, source: 'typed' })),
        after: 1,
      });
    });
  });
}
