import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { pickDate } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-649: when the row choosing started from has left the day (deleted, or
 * moved to another day), the focus goes to the first row still there, never
 * nowhere. Choosing from a row that stays (MM-634) still returns to it.
 */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(today, { name: 'Salmon', meal: 'dinner', kcal: 400 }));
  await repos.food.addFood(foodOn(today, { name: 'Rice', meal: 'dinner', kcal: 200 }));
  await repos.food.addFood(foodOn(today, { name: 'Apple', meal: 'snack', kcal: 95 }));
});

async function startFrom(name: string): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: `More actions for ${name}` }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Select' }));
}

async function change(count: string, action: string): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: `Change ${count}` }));
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('option', { name: action }));
}

it('MM-649: the row choosing started from deleted, the focus goes to the first row left', async () => {
  await startFrom('Rice');
  await change('1 food', 'Delete');
  expect(await screen.findByRole('button', { name: 'Edit Salmon' })).toHaveFocus();
  expect(screen.queryByRole('button', { name: 'Edit Rice' })).not.toBeInTheDocument();
});

it('MM-649: the row choosing started from moved to another day, the focus goes to the first row left', async () => {
  await startFrom('Salmon');
  await change('1 food', 'Move to another day');
  await pickDate('2026-10-25');
  expect(await screen.findByRole('button', { name: 'Edit Rice' })).toHaveFocus();
});

it('MM-634: the row choosing started from stays, the focus returns to it', async () => {
  await startFrom('Salmon');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Rice · 200 kcal' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Salmon · 400 kcal' }));
  await change('1 food', 'Delete');
  expect(await screen.findByRole('button', { name: 'Edit Salmon' })).toHaveFocus();
});
