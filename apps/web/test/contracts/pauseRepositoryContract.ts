import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import type { PauseRepository } from '../../src/domain/repositories/PauseRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

/** What every `PauseRepository` must do. */
export function pauseRepositoryContract(name: string, create: () => PauseRepository | Promise<PauseRepository>): void {
  describe(`${name} as a PauseRepository`, () => {
    let repo: PauseRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 2, 1);
    const pause = (from: CalendarDate, { days = 7, extended = false }: { days?: number; extended?: boolean } = {}) =>
      new Pause({ from, to: from.addDays(days - 1), reason: 'travel', extended });

    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchPauses())).toEqual([]);
    });

    it('lists pauses oldest first, with every field', async () => {
      await repo.savePause(pause(d2));
      await repo.savePause(new Pause({ from: d1, to: d1.addDays(2), reason: 'illness', extended: true }));
      const pauses = await first(repo.watchPauses());
      expect(pauses.map((p) => p.from)).toEqual([d1, d2]);
      expect(pauses[0]?.to).toBe(d1.addDays(2));
      expect(pauses[0]?.reason).toBe('illness');
      expect(pauses[0]?.extended).toBe(true);
      expect(pauses[1]?.extended).toBe(false);
    });

    it('keeps one pause per start day; saving again replaces it', async () => {
      await repo.savePause(pause(d1));
      await repo.savePause(pause(d1, { days: 10, extended: true }));
      const only = single(await first(repo.watchPauses()));
      expect(only.days).toBe(10);
      expect(only.extended).toBe(true);
    });

    it('deletes a pause; deleting a missing one does nothing', async () => {
      await repo.savePause(pause(d1));
      await repo.deletePause(pause(d2));
      expect((await first(repo.watchPauses())).length).toBe(1);
      await repo.deletePause(pause(d1));
      expect(await first(repo.watchPauses())).toEqual([]);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchPauses(), {
        see: (pauses) => pauses.length,
        before: 0,
        change: () => repo.savePause(pause(d1)),
        after: 1,
      });
    });
  });
}
