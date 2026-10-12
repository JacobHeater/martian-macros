import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodSheet, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-48: correct an entry after logging it, move it, and undo a delete. Carried over from food_edit_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(
    foodOn(today, { name: 'Chicken and rice', meal: 'lunch', kcal: 510, proteinG: 51, carbsG: 40, fatG: 10 }),
  );
});

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Chicken and rice');
}

const entriesOn = (day: CalendarDate) => first(repos.food.watchFood(day));

async function openEntry(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: 'Edit Chicken and rice' }));
  return foodSheet('Edit food');
}

async function deleteFromMenu(): Promise<void> {
  await userEvent.click(screen.getByRole('button', { name: 'More actions for Chicken and rice' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
}

it('a number is corrected in place and the meal moved', async () => {
  await openFood();
  const sheet = await openEntry();
  await typeIn(sheet, 'Protein g', '15');
  await typeIn(sheet, /^Calories/, '310');
  await press(sheet, 'Dinner');
  await press(sheet, 'Save changes');
  await expect.poll(async () => (await entriesOn(today))[0]?.kcal).toBe(310);
  const entry = (await entriesOn(today))[0];
  expect(await entriesOn(today)).toHaveLength(1);
  expect(entry?.proteinG).toBe(15);
  expect(entry?.meal).toBe('dinner');
});

it('an entry can be moved to another day', async () => {
  await openFood();
  const sheet = await openEntry();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Previous day' }));
  await press(sheet, 'Save changes');
  await expect.poll(async () => (await entriesOn(today)).length).toBe(0);
  expect(await entriesOn(today.addDays(-1))).toHaveLength(1);
});

it('a deleted entry can be put back with Undo', async () => {
  await openFood();
  await deleteFromMenu();
  await expect.poll(async () => (await entriesOn(today)).length).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await entriesOn(today)).length).toBe(1);
  const back = (await entriesOn(today))[0];
  expect(back?.name).toBe('Chicken and rice');
  expect(back?.proteinG).toBe(51);
  expect(back?.meal).toBe('lunch');
});

it('MM-207: an entry can be deleted from its visible actions and restored', async () => {
  await openFood();
  expect(screen.getByRole('button', { name: 'More actions for Chicken and rice' })).toBeInTheDocument();
  await deleteFromMenu();
  await expect.poll(async () => (await entriesOn(today)).length).toBe(0);
  expect(screen.getByText('Removed Chicken and rice')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await entriesOn(today)).length).toBe(1);
  expect((await entriesOn(today))[0]?.name).toBe('Chicken and rice');
});
