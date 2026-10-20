import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { constant } from '../../src/lang/constant';
import { enterManually, foodSheet, openAddFood, press, typeIn } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * The Add food sheet says what it is about to do (MM-218), tells finding
 * from typing and keeps every way in reach (MM-219), says what an action
 * that is off still needs (MM-220), shows an edited entry's numbers and
 * says what its day control does (MM-221), and says when the food database
 * could not be read (MM-411).
 */
const slowly = { timeout: 15000 };
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const openSheet = async (change?: Parameters<typeof renderApp>[2]) => {
  renderApp(repos, today, change);
  await openTab('Food');
  return openAddFood();
};

it('MM-218: the typed form says what it logs before Log it is on, and once it is, and which calories it keeps', async () => {
  const sheet = await openSheet();
  await enterManually(sheet);
  // Off, and saying why, bound to the action; the empty name says what it needs too.
  const needed = within(sheet).getByText(/^Still needed: a name, calories above zero \(typed, or from the macros\)\.$/);
  expect(within(sheet).getByRole('button', { name: 'Log it' }).getAttribute('aria-describedby')).toContain(needed.id);
  expect(within(sheet).getByText('A name is needed.')).toBeInTheDocument();
  await typeIn(sheet, 'Food name', 'Stew');
  await typeIn(sheet, 'Servings eaten', '1');
  await typeIn(sheet, 'Protein g', '20');
  await typeIn(sheet, 'Carbs g', '30');
  await typeIn(sheet, 'Fat g', '10');
  // Calories left blank: the figure from the macros is what will be logged, and it is said.
  expect(within(sheet).getByTestId('logged-totals')).toHaveTextContent('Logs 290 kcal · 20 g protein · 30 g carbs · 10 g fat');
  expect(within(sheet).queryByText(/^Still needed/)).not.toBeInTheDocument();
  // Calories typed against the macros: the caution names the kept basis, and only the Logs line says what is logged.
  await typeIn(sheet, 'Servings eaten', '2');
  await typeIn(sheet, /^Calories/, '400');
  expect(within(sheet).getByText(/Macros add up to 290 kcal per serving; the 400 typed is kept/)).toBeInTheDocument();
  expect(within(sheet).getByTestId('logged-totals')).toHaveTextContent('Logs 800 kcal · 40 g protein · 60 g carbs · 20 g fat (2 servings)');
  expect(within(sheet).queryAllByText(/will be logged/)).toHaveLength(0);
  // The action carries what it will record, for a reader landing on it.
  const logIt = within(sheet).getByRole('button', { name: 'Log it' });
  expect(logIt.getAttribute('aria-describedby')).toBe(within(sheet).getByTestId('logged-totals').id);
});

it('MM-218: the amount step and the estimate say what they log, in the one wording', async () => {
  const sheet = await openSheet({ change: withCatalog(await fixtureCatalog()) });
  await userEvent.type(sheet.querySelector('input') as HTMLInputElement, 'banana');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Banana/ }, slowly));
  await typeIn(sheet, /^(How many|Amount)/, '1');
  expect(within(sheet).getByTestId('amount-macros')).toHaveTextContent(/^Logs 105 kcal/);
  expect(within(sheet).getByRole('button', { name: 'Log it' }).getAttribute('aria-describedby')).toBe(within(sheet).getByTestId('amount-macros').id);
  await press(sheet, 'Back to search');
  await userEvent.clear(sheet.querySelector('input') as HTMLInputElement);
  await press(sheet, 'Estimate');
  await press(sheet, /^Regular/);
  await press(sheet, 'Mostly protein (meat or fish)');
  expect(within(sheet).getByTestId('estimate-totals')).toHaveTextContent(/^Logs about \d/);
});

it('MM-219: from results the estimate stays in reach, a found food shows it goes on to a step, and the chip is not called Estimate', async () => {
  const sheet = await openSheet({ change: withCatalog(await fixtureCatalog()) });
  await userEvent.type(sheet.querySelector('input') as HTMLInputElement, 'zzqx');
  expect(await within(sheet).findByText('Nothing found for "zzqx".', {}, slowly)).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Enter manually' })).toBeInTheDocument();
  await press(sheet, 'Estimate a meal');
  expect(await within(sheet).findByRole('heading', { name: 'Estimate a meal' })).toBeInTheDocument();
  await press(sheet, 'Back');
  const field = within(sheet).getByRole('textbox', { name: 'Search foods' });
  await userEvent.clear(field);
  await userEvent.type(field, 'chicken');
  const found = await within(sheet).findByRole('button', { name: /^Chicken breast, cooked/ }, slowly);
  expect(found.closest('.mm-list-row')?.querySelector('.mm-list-row-opens')).not.toBeNull();
  await userEvent.clear(within(sheet).getByRole('textbox', { name: 'Search foods' }));
  await enterManually(sheet);
  expect(within(sheet).getByRole('button', { name: 'Estimated totals' })).toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'Estimate' })).not.toBeInTheDocument();
});

it('MM-220: with nothing to estimate from, the estimate offers only the typed form; the sheet always has a Close', async () => {
  const fresh = new InMemoryRepositories();
  await fresh.preferences.saveThemePreference('martian');
  await fresh.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  renderApp(fresh, today);
  await openTab('Food');
  const sheet = await openAddFood();
  expect(within(sheet).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  await press(sheet, 'Estimate');
  expect(await within(sheet).findByText(/enter a rough guess by hand: choose "Estimated totals"/)).toBeInTheDocument();
  expect(within(sheet).queryByRole('group', { name: 'How big was it?' })).not.toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'Log the estimate' })).not.toBeInTheDocument();
  await press(sheet, 'Enter manually');
  expect(within(sheet).getByRole('textbox', { name: 'Food name' })).toBeInTheDocument();
});

it('MM-221: an entry calculated from a serving shows the numbers it rests on, the day control says what it does, and a move is said', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'breakfast',
      name: 'Protein bar',
      kcal: 398,
      proteinG: 40,
      carbsG: 30,
      fatG: 12,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: 2,
        unit: 'serving',
        reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 199, proteinG: 20, carbsG: 15, fatG: 6 }), servingUnit: 'serving' },
      },
    }),
  );
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Edit Protein bar' }));
  const sheet = await foodSheet('Edit food');
  expect(within(sheet).getByText(/^Per serving: 199 kcal · 20 g protein · 15 g carbs · 6 g fat$/)).toBeInTheDocument();
  // The day control is a group named for what it does here, and the day it shows is a status a reader hears change.
  const stepper = within(sheet).getByRole('group', { name: 'Logged on' });
  expect(within(stepper).getByRole('status')).toHaveTextContent('Today');
  await press(sheet, /previous day/i);
  expect(within(stepper).getByRole('status')).toHaveTextContent('Yesterday');
  await press(sheet, 'Save changes');
  expect(await screen.findByText(/^Moved to /, {}, slowly)).toBeInTheDocument();
});

it('MM-221: an old entry without an amount has no method chosen until one is', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Old soup', meal: 'lunch', kcal: 300, proteinG: 10, carbsG: 30, fatG: 12 }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Edit Old soup' }));
  const sheet = await foodSheet('Edit food');
  expect(within(sheet).getByText(/To add one, choose how it was measured/)).toBeInTheDocument();
  const chips = within(within(sheet).getByRole('group', { name: 'How was it measured?' })).getAllByRole('button');
  expect(chips.filter((chip) => chip.getAttribute('aria-pressed') === 'true')).toHaveLength(0);
});

it('MM-411: a food database that cannot be read says so, and Try again asks once more', async () => {
  const real = await fixtureCatalog();
  let fail = true;
  const flaky = Object.create(real) as FoodCatalog;
  Object.defineProperty(flaky, 'search', {
    value: (query: string, options?: { limit?: number; offset?: number }) => (fail ? Promise.reject(new Error('disk I/O error')) : real.search(query, options)),
  });
  const sheet = await openSheet({ change: (services) => ({ ...services, catalog: constant(flaky) }) });
  await userEvent.type(sheet.querySelector('input') as HTMLInputElement, 'chicken');
  expect(await within(sheet).findByText('Could not read the food database', {}, slowly)).toBeInTheDocument();
  expect(within(sheet).queryByText(/^Nothing found/)).not.toBeInTheDocument();
  // A second failure is said again (the alert remounts) and Try again is inert while trying.
  await press(sheet, 'Try again');
  expect(await within(sheet).findByRole('button', { name: 'Try again' }, slowly)).toBeInTheDocument();
  fail = false;
  await press(sheet, 'Try again');
  expect(await within(sheet).findByText('Chicken breast, cooked', {}, slowly)).toBeInTheDocument();
});
