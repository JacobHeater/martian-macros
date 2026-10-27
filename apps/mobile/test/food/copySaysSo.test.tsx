import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { pickDate } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-633: "Copy <meal> to today" said nothing, so a second press copied the
 * meal again; a meal copied only to today. Now a copy is said with Undo, is
 * made once, and goes to any day.
 */
const today = CalendarDate.of(2026, 10, 26);
const yesterday = today.addDays(-1);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(yesterday, { name: 'Oats', meal: 'breakfast', kcal: 300, eatenAt: 8 * 60 }));
  await repos.food.addFood(foodOn(yesterday, { name: 'Eggs', meal: 'breakfast', kcal: 150, eatenAt: 8 * 60 }));
});

const on = (date: CalendarDate) => first(repos.food.watchFood(date));

async function onYesterday(change?: (services: AppServices) => AppServices): Promise<void> {
  renderApp(repos, today, { change });
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
}

it('MM-633: a copy is said, and Undo takes every copy back', async () => {
  await onYesterday();
  await userEvent.click(await screen.findByRole('button', { name: 'Copy breakfast to today' }));
  await expect.poll(async () => (await on(today)).map((f) => f.name)).toEqual(['Oats', 'Eggs']);
  expect(screen.getByText('Copied breakfast to today')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await on(today)).length).toBe(0);
  expect(await on(yesterday), 'the original stays').toHaveLength(2);
});

it('MM-633: pressed again while the copy is made, it copies once', async () => {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await onYesterday((services) => {
    const food = Object.create(services.food) as AppServices['food'];
    const batch = services.food.applyFoodChanges.bind(services.food);
    food.applyFoodChanges = (changes) => gate.then(() => batch(changes));
    return { ...services, food };
  });
  const copy = await screen.findByRole('button', { name: 'Copy breakfast to today' });
  await userEvent.click(copy);
  await userEvent.click(copy);
  release();
  await expect.poll(async () => (await on(today)).length).toBe(2);
  expect(await on(today)).toHaveLength(2);
});

it('MM-633: a meal copies to another day from its menu, with no time eaten', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Options for breakfast' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy to another day' }));
  await pickDate(today.addDays(-3).toString());
  await expect.poll(async () => (await on(today.addDays(-3))).map((f) => [f.name, f.meal, f.eatenAt])).toEqual([
    ['Oats', 'breakfast', undefined],
    ['Eggs', 'breakfast', undefined],
  ]);
});
