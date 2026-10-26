import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { AppServices } from '../../src/state/AppServices';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-624: a food that could not be saved said nothing, a second press while
 * a save was still running logged the food twice, and a cooked food whose
 * fat could not be written was logged without it, so pressing again logged
 * the food a second time. Only AI meal analysis said its failures (MM-591).
 * Skipped until MM-624 is fixed: each case fails on main at f5a08b4.
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

/** The app with its food log's `addFood` replaced. */
const withAddFood =
  (addFood: (original: (entry: FoodEntry) => Promise<number>, entry: FoodEntry) => Promise<number>) =>
  (services: AppServices): AppServices => {
    const food = Object.create(services.food) as AppServices['food'];
    const original = services.food.addFood.bind(services.food);
    food.addFood = (entry) => addFood(original, entry);
    return { ...withCatalog(catalog)(services), food };
  };

async function typedBar(sheet: HTMLElement): Promise<void> {
  await enterManually(sheet);
  await typeIn(sheet, 'Food name', 'Bar');
  await typeIn(sheet, 'Protein g', '10');
  await typeIn(sheet, /^Calories/, '200');
}

it.skip('MM-624: a typed food that cannot be saved says so and keeps the form', async () => {
  renderApp(repos, today, { change: withAddFood(() => Promise.reject(new Error('The disk is full.'))) });
  const sheet = await openAddFood();
  await typedBar(sheet);
  await press(sheet, 'Log it');
  expect(await within(sheet).findByText(/could not be (logged|saved)/i)).toBeInTheDocument();
  expect(within(sheet).getByRole('textbox', { name: 'Food name' })).toHaveValue('Bar');
  expect(await logged()).toEqual([]);
});

it.skip('MM-624: a second press while the save is still running logs the food once', async () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  renderApp(repos, today, { change: withAddFood((original, entry) => gate.then(() => original(entry))) });
  const sheet = await openAddFood();
  await typedBar(sheet);
  const logIt = within(sheet).getByRole('button', { name: 'Log it' });
  await userEvent.click(logIt);
  await userEvent.click(logIt);
  release();
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
  expect(await logged()).toHaveLength(1);
});

it.skip('MM-624: a cooked food whose fat cannot be written is logged with its fat or not at all, and says so', async () => {
  let calls = 0;
  renderApp(repos, today, {
    change: withAddFood((original, entry) => {
      calls += 1;
      return calls === 2 ? Promise.reject(new Error('The disk is full.')) : original(entry);
    }),
  });
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', 'white rice');
  const results = await within(sheet).findAllByRole('button', { name: /^White rice, cooked/ });
  await userEvent.click(results.find((row) => !/Your recent food|From your log/.test(row.textContent ?? '')) ?? (results[0] as HTMLElement));
  await press(sheet, '1 tbsp');
  await press(sheet, 'Log it');
  expect(await within(sheet).findByText(/could not be (logged|saved)/i)).toBeInTheDocument();
  expect((await logged()).length, 'never the food without the fat it was cooked in').not.toBe(1);
});
