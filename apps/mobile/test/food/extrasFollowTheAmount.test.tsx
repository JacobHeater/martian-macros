import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodSheet, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-648: on the typed path, a food's other nutrients (calcium, sugar
 * alcohols) follow the servings, never a corrected calorie. Correcting 100
 * kcal to 200 leaves the calcium as the label stated it; two servings
 * instead of one doubles it.
 */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** One label serving of yogurt, with the calcium and sugar alcohols its label states. */
const yogurt = new FoodEntry({
  id: 0,
  date: today,
  meal: 'breakfast',
  name: 'Greek yogurt',
  kcal: 100,
  proteinG: 17,
  carbsG: 6,
  fatG: 0.7,
  source: 'labelServing',
  portion: {
    method: 'labelServing',
    basis: 'calculated',
    quantity: 1,
    unit: 'serving',
    reference: {
      basis: 'perServing',
      servingUnit: 'serving',
      nutrition: new NutritionTotals({ kcal: 100, proteinG: 17, carbsG: 6, fatG: 0.7 }),
    },
  },
  sugarAlcoholsG: 2,
  micros: new Micronutrients({ calcium: 190 }),
});

const only = async () => {
  const entries = await first(repos.food.watchFood(today));
  expect(entries).toHaveLength(1);
  return entries[0] as FoodEntry;
};

async function openEdit(name: string): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: `Edit ${name}` }));
  return foodSheet('Edit food');
}

async function saveChanges(sheet: HTMLElement): Promise<void> {
  await press(sheet, 'Save changes');
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
}

it('MM-648: a calorie corrected per serving leaves the calcium and sugar alcohols as stated', async () => {
  await repos.food.addFood(yogurt);
  const sheet = await openEdit('Greek yogurt');
  await press(sheet, 'Edit nutrition per serving');
  await typeIn(sheet, /^Calories/, '200');
  await saveChanges(sheet);
  const saved = await only();
  expect(saved.kcal).toBe(200);
  expect(saved.micros.of('calcium')).toBe(190);
  expect(saved.sugarAlcoholsG).toBe(2);
});

it('MM-648: two servings instead of one, typed per serving, doubles them, as the amount changed', async () => {
  await repos.food.addFood(yogurt);
  const sheet = await openEdit('Greek yogurt');
  await press(sheet, 'Edit nutrition per serving');
  await typeIn(sheet, /^How many/, '2');
  await saveChanges(sheet);
  const saved = await only();
  expect(saved.kcal).toBe(200);
  expect(saved.micros.of('calcium')).toBeCloseTo(380, 6);
  expect(saved.sugarAlcoholsG).toBeCloseTo(4, 6);
});

it('MM-648: a calorie corrected on typed totals leaves the calcium as stated', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Stew', kcal: 200, proteinG: 10, carbsG: 20, fatG: 8, micros: new Micronutrients({ calcium: 190 }) }));
  const sheet = await openEdit('Stew');
  await typeIn(sheet, /^Calories/, '400');
  await saveChanges(sheet);
  const saved = await only();
  expect(saved.kcal).toBe(400);
  expect(saved.micros.of('calcium')).toBe(190);
});
