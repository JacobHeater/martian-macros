import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { WeightEventRepository } from '../../src/domain/repositories/WeightEventRepository';
import type { WeightEvent } from '../../src/domain/WeightEvent';
import { WeightEventType } from '../../src/domain/WeightEventType';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `WeightEventRepository` must do. */
export function weightEventRepositoryContract(
  name: string,
  create: () => WeightEventRepository | Promise<WeightEventRepository>,
): void {
  describe(`${name} as a WeightEventRepository`, () => {
    let repo: WeightEventRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 2);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchWeightEvents())).toEqual([]);
    });

    it('lists events oldest first', async () => {
      await repo.saveWeightEvent({ date: d2, type: 'illness' });
      await repo.saveWeightEvent({ date: d1, type: 'travel' });
      const events = await first(repo.watchWeightEvents());
      expect(events.map((event) => event.date.epochDay)).toEqual([d1.epochDay, d2.epochDay]);
    });

    it('keeps one event per day and kind', async () => {
      await repo.saveWeightEvent({ date: d1, type: 'illness' });
      await repo.saveWeightEvent({ date: d1, type: 'illness' });
      await repo.saveWeightEvent({ date: d1, type: 'travel' });
      expect((await first(repo.watchWeightEvents())).length).toBe(2);
    });

    it('same-day events have the same stable kind ordering', async () => {
      for (const type of [...WeightEventType.values].reverse()) {
        await repo.saveWeightEvent({ date: d1, type });
      }
      const events = await first(repo.watchWeightEvents());
      expect(events.map((event) => event.type)).toEqual(WeightEventType.values);
    });

    it('deletes an event; deleting a missing event does nothing', async () => {
      const event: WeightEvent = { date: d1, type: 'illness' };
      await repo.saveWeightEvent(event);
      await repo.deleteWeightEvent({ date: d2, type: 'illness' });
      expect((await first(repo.watchWeightEvents())).length).toBe(1);
      await repo.deleteWeightEvent(event);
      expect(await first(repo.watchWeightEvents())).toEqual([]);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchWeightEvents(), {
        see: (events) => events.length,
        before: 0,
        change: () => repo.saveWeightEvent({ date: d1, type: 'illness' }),
        after: 1,
      });
    });
  });
}
