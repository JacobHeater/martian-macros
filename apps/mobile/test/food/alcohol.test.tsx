import { screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-127: alcohol counts toward calories, is its own line, and is not
 * turned into carbohydrate or fat. Carried over from alcohol_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('button', { name: 'Previous day' });
}

it('a day with no alcohol shows no alcohol line', async () => {
  await openFood();
  expect(screen.queryByText('Alcohol')).not.toBeInTheDocument();
});

it('a logged drink shows its own line at 7 kcal a gram', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'dinner',
      name: 'Wine',
      kcal: 153,
      proteinG: 0,
      carbsG: 13,
      fatG: 0,
      source: 'labelServing',
      alcoholG: 14,
    }),
  );
  await openFood();
  // MM-336: a row of the hero, said as part of the day's total.
  expect((await screen.findByText('Alcohol')).parentElement?.textContent).toBe('Alcohol98 kcal, in the total');
});

it('a typed drink saves without a mismatch and keeps its alcohol', async () => {
  await openFood();
  const sheet = await openAddFood();
  await enterManually(sheet);
  await press(sheet, 'Weighed');
  await typeIn(sheet, 'Food name', 'Two beers');
  await typeIn(sheet, 'Carbs g', '26');
  await typeIn(sheet, /^Calories/, '300');
  expect(within(sheet).getByText(/Double-check the label/)).toBeInTheDocument();
  // 2 standard drinks: 28 g of alcohol is 196 kcal; 104 + 196 = 300.
  await press(sheet, 'Includes alcohol?');
  await typeIn(sheet, 'Alcohol g', '28');
  expect(within(sheet).queryByText(/Double-check the label/)).not.toBeInTheDocument();
  await typeIn(sheet, 'Amount', '700');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  const entry = (await first(repos.food.watchFood(today)))[0];
  expect(entry?.alcoholG).toBe(28);
  expect(entry?.carbsG, 'alcohol is not turned into carbs').toBe(26);
  expect(entry?.fatG).toBe(0);
});

// MM-127's scenario as written: two standard drinks fill in 28 g, and the energy check agrees.
it('a typed drink counted in standard drinks saves 14 g each, without a mismatch', async () => {
  await openFood();
  const sheet = await openAddFood();
  await enterManually(sheet);
  await press(sheet, 'Weighed');
  await typeIn(sheet, 'Food name', 'Two beers');
  await typeIn(sheet, 'Carbs g', '26');
  await typeIn(sheet, /^Calories/, '300');
  await press(sheet, 'Includes alcohol?');
  await typeIn(sheet, 'Standard drinks', '2');
  expect(within(sheet).getByRole('textbox', { name: 'Alcohol g' })).toHaveValue('28');
  expect(within(sheet).queryByText(/Double-check the label/)).not.toBeInTheDocument();
  await typeIn(sheet, 'Amount', '700');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  const entry = (await first(repos.food.watchFood(today)))[0];
  expect(entry?.alcoholG).toBe(28);
  expect(entry?.carbsG, 'alcohol is not turned into carbs').toBe(26);
});

it('grams typed over a count of drinks clear the count; only grams are kept', async () => {
  await openFood();
  const sheet = await openAddFood();
  await enterManually(sheet);
  await press(sheet, 'Includes alcohol?');
  await typeIn(sheet, 'Standard drinks', '1.5');
  expect(within(sheet).getByRole('textbox', { name: 'Alcohol g' })).toHaveValue('21');
  await typeIn(sheet, 'Alcohol g', '10');
  expect(within(sheet).getByRole('textbox', { name: 'Standard drinks' })).toHaveValue('');
});

// The line is on Today's hero too, at the default detail level, and absent with none.
it('Today shows the day’s alcohol as part of the total, and nothing without any', async () => {
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.queryByText('Alcohol')).not.toBeInTheDocument();
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today, meal: 'dinner', name: 'Wine', kcal: 153, proteinG: 0, carbsG: 13, fatG: 0, source: 'labelServing', alcoholG: 14 }),
  );
  expect((await screen.findByText('Alcohol')).parentElement?.textContent).toBe('Alcohol98 kcal, in the total');
});
