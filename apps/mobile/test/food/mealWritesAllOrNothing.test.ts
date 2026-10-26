import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { LoggedMeal } from '../../src/domain/food/meal/LoggedMeal';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import type { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryFoodRepository } from '../../src/fixtures/InMemoryFoodRepository';
import { copyEntries } from '../../src/food/copyEntries';
import { entriesCopiedTo } from '../../src/food/entriesCopiedTo';
import { relogMeal } from '../../src/food/meal/relogMeal';
import { removeMeal } from '../../src/food/meal/removeMeal';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import type { Overlays } from '../../src/ui/Overlays';
import { first } from '../support/first';

/**
 * MM-625: logging a meal is all or nothing (MM-591), but logging it again,
 * copying a slot to today and deleting a meal wrote one food at a time and
 * stopped where a write failed, leaving part of a meal, and a meal half
 * deleted offered no Undo. Skipped until MM-625 is fixed: each case fails
 * on main at f5a08b4.
 */
const yesterday = CalendarDate.of(2026, 10, 25);
const today = CalendarDate.of(2026, 10, 26);

/** "Chicken and rice", three foods, logged yesterday at dinner; gives the log and the meal as read back. */
async function chickenAndRice(): Promise<{ food: InMemoryFoodRepository; meal: LoggedMeal }> {
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  const food = new InMemoryFoodRepository();
  const loggedMeal = { key: 'k1', name: 'Chicken and rice' };
  for (const item of reading.draft.items) {
    await food.addFood(entryOfMealItem(item, { date: yesterday, meal: 'dinner', eatenAt: 19 * 60, loggedMeal }));
  }
  return { food, meal: new LoggedMeal(await first(food.watchFood(yesterday))) };
}

/** Makes the `n`th call of `write` from now on fail. */
function failingOn<T extends unknown[], R>(n: number, write: (...args: T) => Promise<R>): (...args: T) => Promise<R> {
  let calls = 0;
  return (...args: T) => (++calls === n ? Promise.reject(new Error('The disk is full.')) : write(...args));
}

it.skip('MM-625: a meal logged again that fails part way leaves none of it', async () => {
  const { food, meal } = await chickenAndRice();
  food.addFood = failingOn(2, food.addFood.bind(food));
  await expect(relogMeal(food, meal, { date: today, meal: 'lunch', eatenAt: 12 * 60 })).rejects.toThrow('The disk is full.');
  expect(await first(food.watchFood(today)), 'nothing half logged').toEqual([]);
});

it.skip('MM-625: a slot copied to today that fails part way leaves none of it', async () => {
  const { food } = await chickenAndRice();
  const entries: readonly FoodEntry[] = await first(food.watchFood(yesterday));
  food.addFood = failingOn(3, food.addFood.bind(food));
  await expect(copyEntries(food, entriesCopiedTo(today, entries))).rejects.toThrow('The disk is full.');
  expect(await first(food.watchFood(today)), 'nothing half copied').toEqual([]);
});

// Seen by the owner on 2026-10-26: a deleted meal's rows went one at a time.
it.skip('MM-625: a meal deleted goes at once: the day never shows part of it', async () => {
  const { food, meal } = await chickenAndRice();
  const seen: number[] = [];
  const stop = food.watchFood(yesterday).subscribe((entries) => seen.push(entries.length), () => undefined);
  await removeMeal(food, { snack: () => undefined } as unknown as Overlays, meal);
  stop();
  expect(seen.at(-1)).toBe(0);
  expect(seen.filter((count) => count > 0 && count < 3), 'no state with part of the meal').toEqual([]);
});

it.skip('MM-625: a meal that cannot be deleted whole is left whole', async () => {
  const { food, meal } = await chickenAndRice();
  food.deleteFood = failingOn(2, food.deleteFood.bind(food));
  const overlays = { snack: () => undefined } as unknown as Overlays;
  await expect(removeMeal(food, overlays, meal)).rejects.toThrow('The disk is full.');
  expect(await first(food.watchFood(yesterday)), 'no food of the meal lost without an Undo').toHaveLength(3);
});
