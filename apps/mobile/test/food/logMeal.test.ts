import { afterEach, expect, it, vi } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { InMemoryFoodRepository } from '../../src/fixtures/InMemoryFoodRepository';
import { logMeal } from '../../src/food/meal/logMeal';
import { newMealKey } from '../../src/food/meal/newMealKey';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { first } from '../support/first';

/** MM-591: Log meal did nothing on the phone in a live run, where `crypto.randomUUID` does not exist. */
const day = CalendarDate.of(2026, 10, 22);
const draft = () => {
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  return reading.draft;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

it('MM-591: a meal key is made where randomUUID does not exist, as on a page served over http', async () => {
  const real = globalThis.crypto;
  vi.stubGlobal('crypto', { getRandomValues: <T extends ArrayBufferView<ArrayBuffer>>(array: T) => real.getRandomValues(array) });
  expect(globalThis.crypto.randomUUID).toBeUndefined();
  const keys = new Set([newMealKey(), newMealKey(), newMealKey()]);
  expect(keys.size).toBe(3);
  for (const key of keys) expect(key).toMatch(/^[0-9a-f]{32}$/);
});

it('MM-591: a meal is logged where randomUUID does not exist', async () => {
  const real = globalThis.crypto;
  vi.stubGlobal('crypto', { getRandomValues: <T extends ArrayBufferView<ArrayBuffer>>(array: T) => real.getRandomValues(array) });
  const food = new InMemoryFoodRepository();
  const key = await logMeal(food, draft(), { date: day, meal: 'dinner', eatenAt: undefined });
  expect((await first(food.watchFood(day))).map((f) => f.loggedMeal?.key)).toEqual([key, key, key]);
});

it('MM-591: a write that fails logs none of the meal, and the failure is thrown on', async () => {
  const food = new InMemoryFoodRepository();
  food.applyFoodChanges = () => Promise.reject(new Error('The disk is full.'));
  await expect(logMeal(food, draft(), { date: day, meal: 'dinner', eatenAt: undefined })).rejects.toThrow('The disk is full.');
  expect(await first(food.watchFood(day)), 'nothing half logged').toEqual([]);
});

// The owner's Pixel, 2026-11-03: a meal written food by food, each write waiting its turn behind the health import.
it('MM-722: a meal is logged in one write, never food by food', async () => {
  const food = new InMemoryFoodRepository();
  const batch = food.applyFoodChanges.bind(food);
  const writes: number[] = [];
  food.applyFoodChanges = (changes) => {
    writes.push(changes.add?.length ?? 0);
    return batch(changes);
  };
  food.addFood = () => Promise.reject(new Error('Not food by food.'));
  await logMeal(food, draft(), { date: day, meal: 'dinner', eatenAt: undefined });
  expect(writes, 'one write of the three foods').toEqual([3]);
  expect(await first(food.watchFood(day))).toHaveLength(3);
});
