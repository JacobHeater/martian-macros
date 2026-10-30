import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { pickTime } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-714 (the owner): a food's ⋯ menu offers what the chosen foods' dialog
 * does, on that one food, and both copy to another meal of the same day. A
 * logged meal's row does the same for all its foods.
 */
const today = CalendarDate.of(2026, 10, 30);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(today, { name: 'Salmon', meal: 'dinner', kcal: 400, eatenAt: 19 * 60 }));
  await repos.food.addFood(foodOn(today, { name: 'Rice', meal: 'dinner', kcal: 200, eatenAt: 19 * 60 + 10 }));
});

const logged = () => first(repos.food.watchFood(today));
const byName = async (name: string) => (await logged()).find((f) => f.name === name);
const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent);

/** Opens Food and `name`'s ⋯ menu. */
async function openMenuOf(name: string): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: `More actions for ${name}` }));
}

async function pickMeal(name: RegExp): Promise<void> {
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('option', { name }));
}

it("MM-714: a food's menu holds Select and then the chosen foods' seven items, in their order", async () => {
  await openMenuOf('Salmon');
  expect(menuItems()).toEqual([
    'Select',
    'Change time',
    'Move to another meal',
    'Move to another day',
    'Copy to another meal',
    'Copy to another day',
    'Copy to another phone',
    'Delete',
  ]);
});

it('MM-714: one food moved to another meal from its menu; nothing else about it changes', async () => {
  await openMenuOf('Salmon');
  await userEvent.click(screen.getByRole('menuitem', { name: 'Move to another meal' }));
  // Its own meal is not offered.
  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).queryByRole('option', { name: /^Dinner/ })).toBeNull();
  await userEvent.click(within(dialog).getByRole('option', { name: /^Lunch/ }));
  await expect.poll(async () => (await byName('Salmon'))?.meal).toBe('lunch');
  expect((await byName('Salmon'))?.eatenAt, 'the time stays').toBe(19 * 60);
  expect((await byName('Rice'))?.meal).toBe('dinner');
  expect(screen.getByText('Moved Salmon to lunch')).toBeInTheDocument();
});

it('MM-714: one food copied to another meal is a fresh copy there, with no time, and Undo takes it away', async () => {
  await openMenuOf('Salmon');
  await userEvent.click(screen.getByRole('menuitem', { name: 'Copy to another meal' }));
  await pickMeal(/^Breakfast/);
  await expect.poll(async () => (await logged()).filter((f) => f.name === 'Salmon').map((f) => f.meal).sort()).toEqual(['breakfast', 'dinner']);
  const copy = (await logged()).find((f) => f.meal === 'breakfast');
  expect(copy?.eatenAt).toBeUndefined();
  expect(copy?.kcal).toBe(400);
  expect(copy?.id).not.toBe((await logged()).find((f) => f.meal === 'dinner' && f.name === 'Salmon')?.id);
  expect(screen.getByText('Copied Salmon to breakfast')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await logged()).map((f) => f.name)).toEqual(['Salmon', 'Rice']);
});

it("MM-714: one food's time from its menu", async () => {
  await openMenuOf('Rice');
  await userEvent.click(screen.getByRole('menuitem', { name: 'Change time' }));
  await pickTime('18:30');
  await expect.poll(async () => (await byName('Rice'))?.eatenAt).toBe(18 * 60 + 30);
  expect((await byName('Salmon'))?.eatenAt).toBe(19 * 60);
});

it("MM-714: a logged meal's menu copies all its foods to another meal as a new meal", async () => {
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date: today, meal: 'lunch', eatenAt: 12 * 60, loggedMeal: { key: 'k1', name: 'Chicken and rice' } }));
  }
  await openMenuOf('Chicken and rice');
  expect(menuItems()).toEqual([
    'View meal',
    'Select',
    'Change time',
    'Move to another meal',
    'Move to another day',
    'Copy to another meal',
    'Copy to another day',
    'Copy to another phone',
    'Delete',
  ]);
  await userEvent.click(screen.getByRole('menuitem', { name: 'Copy to another meal' }));
  await pickMeal(/^Snack/);
  await expect.poll(async () => (await logged()).filter((f) => f.meal === 'snack')).toHaveLength(3);
  const copies = (await logged()).filter((f) => f.meal === 'snack');
  expect(new Set(copies.map((f) => f.loggedMeal?.key)).size, 'one new meal').toBe(1);
  expect(copies[0]?.loggedMeal?.key).not.toBe('k1');
  expect(copies[0]?.loggedMeal?.name).toBe('Chicken and rice');
  expect((await logged()).filter((f) => f.loggedMeal?.key === 'k1').map((f) => f.meal)).toEqual(['lunch', 'lunch', 'lunch']);
  expect(screen.getByText('Copied Chicken and rice to snacks')).toBeInTheDocument();
});
