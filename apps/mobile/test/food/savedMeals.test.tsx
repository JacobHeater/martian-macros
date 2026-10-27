import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-645 (the owner, 2026-10-26): a meal saved to log again in one press, from Saved or search. */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const saved = () => first(repos.savedMeals.watchSavedMeals());
const logged = () => first(repos.food.watchFood(today));

it('MM-645: a slot saved as a meal keeps its foods, under a name taken from them', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 300 }));
  await repos.food.addFood(foodOn(today, { name: 'Berries', meal: 'breakfast', kcal: 40 }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Options for breakfast' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Save as a meal' }));
  const sheet = await screen.findByRole('dialog', { name: 'Save as a meal' });
  expect(within(sheet).getByRole('textbox', { name: 'Meal name' })).toHaveValue('Oats and berries');
  await typeIn(sheet, 'Meal name', 'Usual breakfast');
  await press(sheet, 'Save meal');
  await expect.poll(async () => (await saved()).map((m) => [m.name, m.foods.map((f) => f.name)])).toEqual([['Usual breakfast', ['Oats', 'Berries']]]);
});

it('MM-645: a saved meal pressed in Saved logs its foods, loose, at the meal of the sheet', async () => {
  await repos.savedMeals.saveMeal('Usual breakfast', [foodOn(today.addDays(-3), { name: 'Oats', meal: 'breakfast', kcal: 300 })], today.addDays(-3));
  renderApp(repos, today);
  const sheet = await openAddFood('lunch');
  await press(sheet, 'Saved');
  expect(await within(sheet).findByText('Your meals')).toBeInTheDocument();
  await press(sheet, /^Usual breakfast/);
  await expect.poll(async () => (await logged()).map((f) => [f.name, f.meal, f.date.epochDay])).toEqual([['Oats', 'lunch', today.epochDay]]);
  expect((await logged())[0]?.loggedMeal).toBeUndefined();
});

it('MM-645: a saved meal is found by search among the person’s own, and logs in one press', async () => {
  await repos.savedMeals.saveMeal('Usual breakfast', [foodOn(today, { name: 'Oats', kcal: 300 })], today);
  renderApp(repos, today);
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', 'usual');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Usual breakfast.*Your meal · logs 1 food/ }));
  await expect.poll(async () => (await logged()).map((f) => f.name)).toEqual(['Oats']);
});

// The UX guard's UX-1 and UX-2: one press logs it once, and Undo takes back exactly what it logged.
it('MM-645: a saved meal logged by mistake is taken back with Undo; pressed twice, it logs once', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Toast', meal: 'lunch', kcal: 150 }));
  await repos.savedMeals.saveMeal('Usual breakfast', [foodOn(today, { name: 'Oats', kcal: 300 }), foodOn(today, { name: 'Berries', kcal: 40 })], today);
  renderApp(repos, today);
  const sheet = await openAddFood('lunch');
  await press(sheet, 'Saved');
  const row = await within(sheet).findByRole('button', { name: /^Usual breakfast.*Meal · logs 2 foods/ });
  await userEvent.click(row);
  await userEvent.click(row).catch(() => undefined);
  await expect.poll(async () => (await logged()).map((f) => f.name)).toEqual(['Toast', 'Oats', 'Berries']);
  await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await logged()).map((f) => f.name)).toEqual(['Toast']);
});

