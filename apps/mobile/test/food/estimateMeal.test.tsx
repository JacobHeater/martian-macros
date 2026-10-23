import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-150: estimate a meal by size and kind. Carried over from estimate_meal_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function open(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Estimate');
  await within(sheet).findByRole('heading', { name: 'Estimate a meal' });
  return sheet;
}

const only = async () => {
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  return (await first(repos.food.watchFood(today)))[0];
};

it('a regular balanced meal is logged as an estimate', async () => {
  const sheet = await open();
  expect(within(sheet).getByText(/usually have more than they look/)).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /^Regular · about/ })).toBeInTheDocument();
  await typeIn(sheet, 'Name (optional)', 'Thai place, usual');
  await press(sheet, 'Log the estimate');
  const entry = await only();
  expect(entry?.name).toBe('Thai place, usual');
  expect(entry?.source).toBe('quickAdd');
  expect(entry?.portion?.quantity).toBeUndefined();
  expect((entry?.kcal ?? 1) % 50, 'rounded to 50 kcal').toBe(0);
  // Carbohydrate, protein and fat follow the balanced split.
  expectClose(4 * (entry?.proteinG ?? 0) + 4 * (entry?.carbsG ?? 0) + 9 * (entry?.fatG ?? 0), entry?.kcal ?? 0, 1e-6);
  expect(await screen.findByText('Estimated totals')).toBeInTheDocument();
});

it('a larger size and a richer kind change the entry', async () => {
  const sheet = await open();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Large · about/ }));
  await userEvent.click(within(sheet).getByRole('button', { name: /^Rich \(fried/ }));
  await press(sheet, 'Log the estimate');
  const entry = await only();
  expect(entry?.name).toBe('Estimated meal (large, rich)');
  expectClose(((entry?.fatG ?? 0) * 9) / (entry?.kcal ?? 1), 0.5, 1e-9);
});

// MM-150: an estimate comes back from recents with its mark, so it is never mistaken for a measured food.
it('an estimated meal in recents keeps its estimated mark', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today.addDays(-1),
      meal: 'dinner',
      name: 'Thai place, usual',
      kcal: 900,
      proteinG: 45,
      carbsG: 112,
      fatG: 30,
      source: 'quickAdd',
      portion: { method: 'quickAdd', basis: 'enteredTotals' },
    }),
  );
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today.addDays(-1), meal: 'lunch', name: 'Thai curry, weighed', kcal: 600, proteinG: 30, carbsG: 50, fatG: 25, source: 'weighed' }),
  );
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  // The one-tap chip carries the mark too (the panel's UX-7).
  expect(within(sheet).getByRole('button', { name: /^Thai place, usual.*· estimated/ })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /^Thai curry, weighed/ })).toBeInTheDocument();
  await typeIn(sheet, 'Search foods', 'thai');
  // Found in the whole log (MM-596), still marked.
  expect(await within(sheet).findByText('From your log · estimated · 900 kcal')).toBeInTheDocument();
  expect(within(sheet).getByText('From your log · 600 kcal')).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Thai place, usual/ }));
  // Refilled as estimated totals, in one tap, with Log it ready.
  expect(within(sheet).getByRole('button', { name: 'Estimated totals', pressed: true })).toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  expect((await first(repos.food.watchFood(today)))[0]?.source).toBe('quickAdd');
});
