import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-382: a graded food's popover says what its source left unstated and so was not counted. */
const today = CalendarDate.of(2026, 10, 18);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const lentils = (name: string, micros: Micronutrients) =>
  repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'lunch',
      name,
      kcal: 116,
      proteinG: 9,
      carbsG: 20,
      fatG: 0.4,
      fiberG: 7.9,
      sodiumMg: 2,
      source: 'weighed',
      micros,
      portion: { method: 'weighed', basis: 'calculated', quantity: 100, unit: 'gram', reference: { basis: 'per100g', nutrition: new NutritionTotals({ kcal: 116, proteinG: 9, carbsG: 20, fatG: 0.4 }) } },
    }),
  );

async function popoverOf(name: RegExp): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name }));
  return screen.findByRole('dialog');
}

it('says the grade is per calorie, and what was not stated', async () => {
  await lentils('Lentils, from a pack', new Micronutrients({}));
  const dialog = await popoverOf(/^Grade A minus for Lentils, from a pack/);
  expect(within(dialog).getByText(/from what it gives per calorie/)).toHaveTextContent(
    'Sugars and saturated fat aren’t stated for this food, so they weren’t counted. None of the 10 vitamins and minerals the grade looks at are stated for this food, so they weren’t counted either.',
  );
});

it('says how many vitamins and minerals it counted from, and names a single missing refinement', async () => {
  await lentils('Lentils, from a label', new Micronutrients({ sugars: 1.8, potassium: 369, calcium: 19, iron: 3.3, vitaminD: 0 }));
  const dialog = await popoverOf(/^Grade A for Lentils, from a label/);
  expect(within(dialog).getByText(/from what it gives per calorie/)).toHaveTextContent(
    'Saturated fat isn’t stated for this food, so it wasn’t counted. Vitamins and minerals were counted from the 4 that are stated.',
  );
});

it('says only 3 of the 10 are stated when the component was not counted', async () => {
  await lentils('Lentils, three stated', new Micronutrients({ sugars: 1.8, saturatedFat: 0.05, potassium: 369, calcium: 19, iron: 3.3 }));
  const dialog = await popoverOf(/^Grade A minus for Lentils, three stated/);
  expect(within(dialog).getByText(/from what it gives per calorie/)).toHaveTextContent(
    /Only 3 of the 10 vitamins and minerals the grade looks at are stated for this food, so they weren’t counted\.$/,
  );
});
