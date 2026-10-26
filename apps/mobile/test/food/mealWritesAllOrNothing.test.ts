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
 * copying a slot to today and deleting a meal wrote one food at a time: the
 * owner watched a deleted meal's rows go one by one, and a write that failed
 * part way left part of a meal, a meal half deleted with no Undo. Each case
 * failed on main at f5a08b4.
 */
const yesterday = CalendarDate.of(2026, 10, 25);
const today = CalendarDate.of(2026, 10, 26);
const overlays = { snack: () => undefined } as unknown as Overlays;

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

/**
 * Makes the log refuse its second food from now on, however it is written:
 * one at a time, the second call fails; in one batch of two or more, the
 * batch fails, as a transaction whose second statement fails does.
 */
function secondFoodFails(food: InMemoryFoodRepository): void {
  const fail = () => Promise.reject(new Error('The disk is full.'));
  const add = food.addFood.bind(food);
  const remove = food.deleteFood.bind(food);
  const batch = food.applyFoodChanges.bind(food);
  let adds = 0;
  let deletes = 0;
  food.addFood = (entry: FoodEntry) => (++adds === 2 ? fail() : add(entry));
  food.deleteFood = (id: number) => (++deletes === 2 ? fail() : remove(id));
  food.applyFoodChanges = (changes) =>
    (changes.add?.length ?? 0) >= 2 || (changes.delete?.length ?? 0) >= 2 ? fail() : batch(changes);
}

/** Whether `work` finished, without throwing on. */
const outcome = (work: Promise<unknown>) => work.then(() => 'done' as const, () => 'failed' as const);

it('MM-625: a meal logged again that fails part way leaves none of it', async () => {
  const { food, meal } = await chickenAndRice();
  secondFoodFails(food);
  expect(await outcome(relogMeal(food, meal, { date: today, meal: 'lunch', eatenAt: 12 * 60 }))).toBe('failed');
  expect(await first(food.watchFood(today)), 'nothing half logged').toEqual([]);
});

it('MM-625: a slot copied to today that fails part way leaves none of it', async () => {
  const { food } = await chickenAndRice();
  const entries: readonly FoodEntry[] = await first(food.watchFood(yesterday));
  secondFoodFails(food);
  expect(await outcome(copyEntries(food, entriesCopiedTo(today, entries)))).toBe('failed');
  expect(await first(food.watchFood(today)), 'nothing half copied').toEqual([]);
});

// Seen by the owner on 2026-10-26: a deleted meal's rows went one at a time.
it('MM-625: a meal deleted goes at once: the day never shows part of it', async () => {
  const { food, meal } = await chickenAndRice();
  const seen: number[] = [];
  const stop = food.watchFood(yesterday).subscribe(
    (entries) => seen.push(entries.length),
    () => undefined,
  );
  await removeMeal(food, overlays, meal);
  stop();
  expect(seen.at(-1)).toBe(0);
  expect(
    seen.filter((count) => count > 0 && count < 3),
    'no state with part of the meal',
  ).toEqual([]);
});

it('MM-625: a meal that cannot be deleted whole is left whole', async () => {
  const { food, meal } = await chickenAndRice();
  secondFoodFails(food);
  expect(await outcome(removeMeal(food, overlays, meal))).toBe('failed');
  expect(await first(food.watchFood(yesterday)), 'no food of the meal lost without an Undo').toHaveLength(3);
});
