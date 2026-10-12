import { expect, it } from 'vitest';
import { CalendarDate, type DayCompleteness, FoodEntry, intakeDaysFrom, type QuantitySource } from '../../src/domain';
import { expectClose } from '../support/expectClose';

const food = (name: string, kcal: number, date: CalendarDate, source: QuantitySource = 'labelServing') =>
  new FoodEntry({
    id: 0,
    date,
    meal: 'lunch',
    name,
    kcal,
    proteinG: (kcal * 0.3) / 4,
    carbsG: (kcal * 0.4) / 4,
    fatG: (kcal * 0.3) / 9,
    source,
  });

const day = CalendarDate.of(2026, 10, 5);

it('aggregates days with marks and measurement quality', () => {
  const days = intakeDaysFrom(
    [food('A', 600, day, 'weighed'), food('B', 400, day, 'palm'), food('C', 500, day.addDays(-1))],
    new Map<number, DayCompleteness>([[day.epochDay, 'complete']]),
  );
  expect(days.map((d) => d.date.epochDay)).toEqual([day.addDays(-1).epochDay, day.epochDay]);
  const today = days.at(-1);
  expect(today?.kcal).toBe(1000);
  expect(today?.completeness).toBe('complete');
  expectClose(today?.weighedShare, 0.6, 1e-9);
  // sqrt((600*.05)^2 + (400*.25)^2) / 1000
  expectClose(today?.relativeSigma, 0.1044, 1e-4);
  expect(days[0]?.completeness).toBe('unmarked');
});

it('no entries, no days', () => {
  expect(intakeDaysFrom([], new Map())).toEqual([]);
});
