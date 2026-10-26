import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';

/**
 * MM-623: a recent food logged again kept only its name and macros. The
 * sheet's save read the extra nutrients from the entry being edited, which
 * a new log does not have, and the form refilled a calculated food as typed
 * totals, so a changed amount changed nothing. Skipped until MM-623 is
 * fixed: each case fails on main at f5a08b4.
 */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const logged = () => first(repos.food.watchFood(today));

/** One label serving of yogurt, yesterday, with every extra its label states, a known zero among them. */
const yogurt = new FoodEntry({
  id: 0,
  date: today.addDays(-1),
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
  fiberG: 2,
  sugarAlcoholsG: 0,
  sodiumMg: 60,
  micros: new Micronutrients({ calcium: 190 }),
});

/** 180 g of cooked rice from a pack, yesterday, calculated from its per-100 g numbers. */
const rice = new FoodEntry({
  id: 0,
  date: today.addDays(-1),
  meal: 'dinner',
  name: 'White rice, cooked',
  kcal: 234,
  proteinG: 4.86,
  carbsG: 50.4,
  fatG: 0.54,
  source: 'weighed',
  portion: {
    method: 'weighed',
    basis: 'calculated',
    quantity: 180,
    unit: 'gram',
    reference: { basis: 'per100g', nutrition: new NutritionTotals({ kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 }) },
    origin: { packId: 'generic', foodId: 42, source: 'usda_fndds', sourceId: '1234' },
  },
  fiberG: 0.72,
  sodiumMg: 1.8,
});

it.skip('MM-623: a recent label serving logged as two servings keeps and doubles its extras', async () => {
  await repos.food.addFood(yogurt);
  renderApp(repos, today);
  const sheet = await openAddFood();
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Greek yogurt/ }));
  await typeIn(sheet, /^How many/, '2');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  const [again] = await logged();
  expect(again?.kcal).toBe(200);
  expect(again?.fiberG).toBe(4);
  expect(again?.sodiumMg).toBe(120);
  expect(again?.sugarAlcoholsG, 'a known zero stays zero, never unknown').toBe(0);
  expect(again?.micros.of('calcium')).toBe(380);
});

it.skip('MM-623: a recent weighed food logged at another weight is calculated for that weight, from the same food', async () => {
  await repos.food.addFood(rice);
  renderApp(repos, today);
  const sheet = await openAddFood();
  await userEvent.click(await within(sheet).findByRole('button', { name: /^White rice, cooked/ }));
  await typeIn(sheet, /^Amount/, '200');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  const [again] = await logged();
  expect(again?.kcal).toBeCloseTo(260, 6);
  expect(again?.portion?.basis).toBe('calculated');
  expect(again?.portion?.origin?.foodId, 'the food it came from is kept').toBe(42);
  expect(again?.fiberG).toBeCloseTo(0.8, 6);
});
