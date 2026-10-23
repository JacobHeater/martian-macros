import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { entriesCopiedTo } from '../../src/food/entriesCopiedTo';
import { enterManually, foodSheet, openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { clockTurnOf, turnClock } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-570: a food records when it was eaten. A new food logged for today
 * starts at the time it is now on the app's clock; one logged for another
 * day, or copied, has no time until one is given; the editor's "Time eaten"
 * row changes it, and an edit keeps it.
 */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const entriesOn = (day: CalendarDate) => first(repos.food.watchFood(day));
const timeRow = (sheet: HTMLElement) => within(sheet).getByRole('button', { name: /^Time eaten/ });

/** Types a stew in the form a food is typed in. */
async function typeStew(sheet: HTMLElement): Promise<void> {
  await enterManually(sheet);
  await typeIn(sheet, 'Food name', 'Stew');
  await typeIn(sheet, 'Servings eaten', '1');
  await typeIn(sheet, 'Protein g', '20');
  await typeIn(sheet, 'Carbs g', '30');
  await typeIn(sheet, 'Fat g', '10');
}

/** Turns the clock the row opens to `value` ("13:45") and confirms it. */
async function giveTimeEaten(sheet: HTMLElement, value: string): Promise<void> {
  await userEvent.click(timeRow(sheet));
  const dialog = await screen.findByRole('dialog', { name: 'Time eaten' });
  await turnClock(dialog, clockTurnOf(value));
  await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
}

it('a food logged for today at 8 AM on the clock is stored as eaten at 8:00 AM', async () => {
  renderApp(repos, today, { hour: 8 });
  await openTab('Food');
  const sheet = await openAddFood('breakfast');
  await typeStew(sheet);
  expect(timeRow(sheet)).toHaveTextContent('8:00 AM');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await entriesOn(today)).length).toBe(1);
  expect((await entriesOn(today))[0]?.eatenAt).toBe(8 * 60);
});

it('a food logged for yesterday has no time eaten, and the row says so', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  const sheet = await openAddFood();
  await typeStew(sheet);
  expect(timeRow(sheet)).toHaveTextContent('Not set');
  await press(sheet, 'Log it');
  const yesterday = today.addDays(-1);
  await expect.poll(async () => (await entriesOn(yesterday)).length).toBe(1);
  expect((await entriesOn(yesterday))[0]?.eatenAt).toBeUndefined();
});

it('a time changed in the editor is the one saved', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await typeStew(sheet);
  await giveTimeEaten(sheet, '13:45');
  expect(timeRow(sheet)).toHaveTextContent('1:45 PM');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await entriesOn(today)).length).toBe(1);
  expect((await entriesOn(today))[0]?.eatenAt).toBe(13 * 60 + 45);
});

it('an edit keeps the time eaten unless it is changed, and can change it', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Chicken and rice', meal: 'lunch', kcal: 510, proteinG: 51, carbsG: 40, fatG: 10, eatenAt: 11 * 60 + 20 }));
  renderApp(repos, today, { hour: 18 });
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Edit Chicken and rice' }));
  let sheet = await foodSheet('Edit food');
  expect(timeRow(sheet)).toHaveTextContent('11:20 AM');
  await typeIn(sheet, 'Protein g', '45');
  await press(sheet, 'Save changes');
  await expect.poll(async () => (await entriesOn(today))[0]?.proteinG).toBe(45);
  expect((await entriesOn(today))[0]?.eatenAt, 'not moved to the time it is now').toBe(11 * 60 + 20);

  await userEvent.click(await screen.findByRole('button', { name: 'Edit Chicken and rice' }));
  sheet = await foodSheet('Edit food');
  await giveTimeEaten(sheet, '12:05');
  await press(sheet, 'Save changes');
  await expect.poll(async () => (await entriesOn(today))[0]?.eatenAt).toBe(12 * 60 + 5);
});

it('an entry logged before times were kept opens with its time not set, and keeps none when saved', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Chicken and rice', meal: 'lunch', kcal: 510, proteinG: 51, carbsG: 40, fatG: 10 }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Edit Chicken and rice' }));
  const sheet = await foodSheet('Edit food');
  expect(timeRow(sheet)).toHaveTextContent('Not set');
  await typeIn(sheet, 'Protein g', '45');
  await press(sheet, 'Save changes');
  await expect.poll(async () => (await entriesOn(today))[0]?.proteinG).toBe(45);
  expect((await entriesOn(today))[0]?.eatenAt).toBeUndefined();
});

it('a copy has no time eaten, whatever the original had', () => {
  const [copy] = entriesCopiedTo(today, [foodOn(today.addDays(-1), { name: 'Pasta', eatenAt: 19 * 60 })]);
  expect(copy?.eatenAt).toBeUndefined();
});
