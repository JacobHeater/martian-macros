import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { AppServices } from '../../src/state/AppServices';
import { openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-631 (the owner, 2026-10-26, D-1 and D-2): several foods for one meal
 * in one sitting, kept in an "In this meal" list and logged together, as
 * loose foods, at one meal and one time.
 */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;
let catalog: FoodCatalog;

beforeAll(async () => {
  catalog = await fixtureCatalog();
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const logged = () => first(repos.food.watchFood(today));

async function open(change: (services: AppServices) => AppServices = withCatalog(catalog)): Promise<HTMLElement> {
  renderApp(repos, today, { change, hour: 21 });
  await openTab('Food');
  return openAddFood('dinner');
}

/** Finds `query` in the packs and opens its amount step. */
async function find(sheet: HTMLElement, query: string, name: RegExp): Promise<void> {
  await typeIn(sheet, 'Search foods', query);
  const results = await within(sheet).findAllByRole('button', { name });
  await userEvent.click(results.find((row) => !/Your recent food|From your log|In this meal/.test(row.textContent ?? '')) ?? (results[0] as HTMLElement));
  await within(sheet).findByRole('button', { name: /^Log / });
}

it('MM-631: three foods to dinner in one sheet, the time set once, logged together', async () => {
  const sheet = await open();
  await find(sheet, 'white rice cooked', /^White rice, cooked/);
  await press(sheet, 'Add another food');
  expect(await within(sheet).findByText(/^In this meal · 1 food/)).toBeInTheDocument();
  expect(await logged(), 'nothing logged yet').toEqual([]);
  // Said, and the list's line holds the focus (the UX guard's UX-1).
  expect(screen.getByText(/^Added White rice, cooked · 1 food in this meal/)).toBeInTheDocument();
  expect(document.activeElement?.textContent).toMatch(/^In this meal · 1 food/);
  await find(sheet, 'banana', /^Banana/);
  // In the list, the amount step asks no meal or time: the list's are used.
  expect(within(sheet).queryByRole('button', { name: /^Time eaten/ })).not.toBeInTheDocument();
  await press(sheet, 'Add another food');
  await find(sheet, 'chicken breast cooked', /^Chicken breast, cooked/);
  await press(sheet, 'Log 3 foods');
  await expect.poll(async () => (await logged()).length).toBe(3);
  const foods = await logged();
  expect(foods.map((f) => f.meal)).toEqual(['dinner', 'dinner', 'dinner']);
  expect(new Set(foods.map((f) => f.eatenAt)).size, 'one time for all').toBe(1);
  expect(foods.every((f) => f.loggedMeal === undefined), 'loose foods, not a named meal').toBe(true);
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
});

it('MM-631: one food still logs in one press', async () => {
  const sheet = await open();
  await find(sheet, 'banana', /^Banana/);
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
});

it('MM-631: the list logs from the search step, and a food is taken out of it', async () => {
  const sheet = await open();
  await find(sheet, 'white rice cooked', /^White rice, cooked/);
  await press(sheet, 'Add another food');
  await find(sheet, 'banana', /^Banana/);
  await press(sheet, 'Add another food');
  expect(await within(sheet).findByText(/^In this meal · 2 foods/)).toBeInTheDocument();
  // While a search is typed the list is its one line; cleared, its foods and its action show.
  expect(within(sheet).queryByRole('button', { name: 'Remove White rice, cooked' })).not.toBeInTheDocument();
  await typeIn(sheet, 'Search foods', '');
  await press(sheet, 'Remove White rice, cooked');
  expect(await within(sheet).findByText(/^In this meal · 1 food/)).toBeInTheDocument();
  // Said, and undoable (the UX guard's UX-1).
  expect(screen.getByText('Removed White rice, cooked')).toBeInTheDocument();
  await press(sheet, 'Log 1 food');
  await expect.poll(async () => (await logged()).map((f) => f.name)).toEqual(['Banana']);
});

it('MM-631: leaving with foods in the list asks first, and kept, the list stays', async () => {
  const sheet = await open();
  await find(sheet, 'banana', /^Banana/);
  await press(sheet, 'Add another food');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
  const ask = await screen.findByRole('dialog', { name: 'Discard 1 food?' });
  await userEvent.click(within(ask).getByRole('button', { name: 'Keep' }));
  expect(await within(sheet).findByText(/^In this meal · 1 food/)).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }));
  await userEvent.click(within(await screen.findByRole('dialog', { name: 'Discard 1 food?' })).getByRole('button', { name: 'Discard' }));
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
  expect(await logged()).toEqual([]);
});

it('MM-631: a list that cannot be logged logs none, stays, and says so', async () => {
  const sheet = await open((services) => {
    const food = Object.create(services.food) as AppServices['food'];
    food.applyFoodChanges = () => Promise.reject(new Error('The disk is full.'));
    return { ...withCatalog(catalog)(services), food };
  });
  await find(sheet, 'banana', /^Banana/);
  await press(sheet, 'Add another food');
  await typeIn(sheet, 'Search foods', '');
  await press(sheet, 'Log 1 food');
  expect(await within(sheet).findByText(/^The foods could not be logged, so none were/)).toBeInTheDocument();
  expect(within(sheet).getByText(/^In this meal · 1 food/)).toBeInTheDocument();
  expect(await logged()).toEqual([]);
});

it('MM-631: a failure from the last food’s step names the button that is there', async () => {
  const sheet = await open((services) => {
    const food = Object.create(services.food) as AppServices['food'];
    food.applyFoodChanges = () => Promise.reject(new Error('The disk is full.'));
    return { ...withCatalog(catalog)(services), food };
  });
  await find(sheet, 'banana', /^Banana/);
  await press(sheet, 'Add another food');
  await find(sheet, 'white rice cooked', /^White rice, cooked/);
  await press(sheet, 'Log 2 foods');
  expect(await within(sheet).findByText('The food could not be logged, so nothing was. Press Log 2 foods to try again.')).toBeInTheDocument();
});

it('MM-631: a food with its cooking fat counts both', async () => {
  const sheet = await open();
  await find(sheet, 'banana', /^Banana/);
  await press(sheet, 'Add another food');
  await find(sheet, 'white rice cooked', /^White rice, cooked/);
  await press(sheet, '1 tbsp');
  await press(sheet, 'Log 3 foods');
  await expect.poll(async () => (await logged()).length).toBe(3);
});

