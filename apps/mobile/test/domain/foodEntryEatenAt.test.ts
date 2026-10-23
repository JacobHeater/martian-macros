import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { mealUsualMinute } from '../../src/domain/mealUsualMinute';
import { ArgumentError } from '../../src/lang/ArgumentError';

/** MM-570: a food entry keeps the minute of its own day it was eaten, or none when that is not known. */
const day = CalendarDate.of(2026, 10, 22);
const soup = (eatenAt?: number) =>
  new FoodEntry({ id: 0, date: day, meal: 'lunch', name: 'Soup', kcal: 300, proteinG: 10, carbsG: 30, fatG: 8, source: 'weighed', eatenAt });

it('an entry given no time eaten has none, and nothing is invented for it', () => {
  expect(soup().eatenAt).toBeUndefined();
});

it('an entry keeps the minute it was eaten, from midnight to the last minute of its day', () => {
  expect(soup(13 * 60 + 7).eatenAt).toBe(13 * 60 + 7);
  expect(soup(0).eatenAt).toBe(0);
  expect(soup(1439).eatenAt).toBe(1439);
});

it('a time outside its day, or not on a whole minute, is refused', () => {
  for (const bad of [-1, 1440, 12.5, Number.NaN]) expect(() => soup(bad), String(bad)).toThrow(ArgumentError);
});

it("each meal has a usual minute, in the day's order", () => {
  expect([mealUsualMinute('breakfast'), mealUsualMinute('lunch'), mealUsualMinute('snack'), mealUsualMinute('dinner')]).toEqual([
    8 * 60,
    12 * 60 + 30,
    15 * 60 + 30,
    18 * 60 + 30,
  ]);
});
