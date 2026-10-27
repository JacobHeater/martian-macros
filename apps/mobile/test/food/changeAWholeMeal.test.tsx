import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { pickDate, pickTime } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-630: one time, meal or day for every food of a meal, from its ⋯ menu,
 * in one step with Undo. Only the field chosen changes.
 */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(today, { name: 'Salmon', meal: 'dinner', kcal: 400, eatenAt: 19 * 60 }));
  await repos.food.addFood(foodOn(today, { name: 'Rice', meal: 'dinner', kcal: 200, eatenAt: 19 * 60 + 10 }));
  await repos.food.addFood(foodOn(today, { name: 'Salad', meal: 'dinner', kcal: 80 }));
});

const on = (date: CalendarDate) => first(repos.food.watchFood(date));

async function choose(action: string): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Options for dinner' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: action }));
}

it('MM-630: one time for every food of the meal, nothing else changed, and Undo puts each back', async () => {
  const before = await on(today);
  await choose('Change time');
  await pickTime('18:30');
  await expect.poll(async () => (await on(today)).map((f) => f.eatenAt)).toEqual([18 * 60 + 30, 18 * 60 + 30, 18 * 60 + 30]);
  const after = await on(today);
  expect(after.map((f) => [f.id, f.name, f.kcal, f.meal])).toEqual(before.map((f) => [f.id, f.name, f.kcal, f.meal]));
  expect(screen.getByText('Dinner at 6:30 PM, all 3 foods')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await on(today)).map((f) => f.eatenAt)).toEqual([19 * 60, 19 * 60 + 10, undefined]);
});

it('MM-630: the meal moved to lunch keeps each food’s own time', async () => {
  await choose('Move to another meal');
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('option', { name: /^Lunch/ }));
  await expect.poll(async () => (await on(today)).map((f) => f.meal)).toEqual(['lunch', 'lunch', 'lunch']);
  expect((await on(today)).map((f) => f.eatenAt)).toEqual([19 * 60, 19 * 60 + 10, undefined]);
});

it('MM-630: the meal moved to yesterday keeps its times (the owner, 2026-10-26)', async () => {
  await choose('Move to another day');
  await pickDate(today.addDays(-1).toString());
  await expect.poll(async () => (await on(today.addDays(-1))).map((f) => [f.name, f.eatenAt])).toEqual([
    ['Salmon', 19 * 60],
    ['Rice', 19 * 60 + 10],
    ['Salad', undefined],
  ]);
  expect(await on(today)).toEqual([]);
});
