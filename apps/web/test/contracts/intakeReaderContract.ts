import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { DayMarkRepository } from '../../src/domain/repositories/DayMarkRepository';
import type { FoodRepository } from '../../src/domain/repositories/FoodRepository';
import type { IntakeReader } from '../../src/domain/repositories/IntakeReader';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';
import { single } from '../support/single';

const entry = (date: CalendarDate, kcal: number) =>
  new FoodEntry({
    id: 0,
    date,
    meal: 'dinner',
    name: 'Food',
    kcal,
    proteinG: 20,
    carbsG: 30,
    fatG: 10,
    source: 'weighed',
  });

interface Made {
  food: FoodRepository;
  marks: DayMarkRepository;
  intake: IntakeReader;
}

/**
 * What every `IntakeReader` must do. `create` returns an intake reader and
 * the food log and day marks it derives from.
 */
export function intakeReaderContract(name: string, create: () => Made | Promise<Made>): void {
  describe(`${name} as an IntakeReader`, () => {
    let food: FoodRepository;
    let marks: DayMarkRepository;
    let intake: IntakeReader;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 2);
    const d3 = CalendarDate.of(2026, 1, 3);

    beforeEach(async () => {
      ({ food, marks, intake } = await create());
    });

    it('no food, no intake days', async () => {
      expect(await first(intake.watchIntakeDays({ since: d1 }))).toEqual([]);
    });

    it('sums each day with food, oldest first', async () => {
      await food.addFood(entry(d2, 500));
      await food.addFood(entry(d1, 300));
      await food.addFood(entry(d1, 200));
      const days = await first(intake.watchIntakeDays({ since: d1 }));
      expect(days.map((d) => d.date.epochDay)).toEqual([d1.epochDay, d2.epochDay]);
      expect(days.map((d) => d.kcal)).toEqual([500, 500]);
      expect(days[0]?.proteinG).toBe(40);
    });

    it('leaves out days before since', async () => {
      await food.addFood(entry(d1, 300));
      await food.addFood(entry(d3, 400));
      const days = await first(intake.watchIntakeDays({ since: d2 }));
      expect(days.map((d) => d.date.epochDay)).toEqual([d3.epochDay]);
    });

    it('carries the completeness mark of the day', async () => {
      await food.addFood(entry(d1, 300));
      await marks.setCompleteness(d1, 'partial');
      expect(single(await first(intake.watchIntakeDays({ since: d1 }))).completeness).toBe('partial');
    });

    it('changes when the food log changes', async () => {
      await expectChangeEmits(intake.watchIntakeDays({ since: d1 }), {
        see: (l) => l.length,
        before: 0,
        change: () => food.addFood(entry(d1, 300)),
        after: 1,
      });
    });
  });
}
