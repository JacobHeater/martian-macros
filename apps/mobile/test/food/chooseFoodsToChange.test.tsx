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
 * MM-634: some foods of a day, from any meals, chosen and changed together:
 * one time, meal or day, copied, or deleted, in one step with Undo. A logged
 * meal's row stands for all its foods.
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
  await repos.food.addFood(foodOn(today, { name: 'Apple', meal: 'snack', kcal: 95, eatenAt: 15 * 60 }));
});

const logged = () => first(repos.food.watchFood(today));
const byName = async (name: string) => (await logged()).find((f) => f.name === name);

/** Opens Food and starts choosing from `name`'s menu. */
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

it('MM-634: two foods of dinner and a snack get one time; the rest are untouched', async () => {
  await startFrom('Salmon');
  expect(screen.getByRole('checkbox', { name: 'Salmon · 400 kcal' })).toBeChecked();
  // The box choosing started from holds the focus, and how to choose is said (the UX guard's UX-1).
  expect(screen.getByRole('checkbox', { name: 'Salmon · 400 kcal' })).toHaveFocus();
  expect(screen.getByText('Choosing: tick the foods to change together')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('checkbox', { name: 'Apple · 95 kcal' }));
  expect(screen.getByText('2 foods chosen')).toBeInTheDocument();
  await change('2 foods', 'Change time');
  await pickTime('18:30');
  await expect.poll(async () => (await byName('Salmon'))?.eatenAt).toBe(18 * 60 + 30);
  expect((await byName('Apple'))?.eatenAt).toBe(18 * 60 + 30);
  expect((await byName('Apple'))?.meal, 'only the time changed').toBe('snack');
  expect((await byName('Rice'))?.eatenAt).toBe(19 * 60 + 10);
  expect(screen.queryByRole('button', { name: 'Done' }), 'choosing ends').not.toBeInTheDocument();
});

it('MM-634: a logged meal chosen counts as all its foods, and they move together', async () => {
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date: today, meal: 'lunch', eatenAt: 12 * 60, loggedMeal: { key: 'k1', name: 'Chicken and rice' } }));
  }
  await startFrom('Chicken and rice');
  await change('3 foods', 'Move to another meal');
  const dialog = await screen.findByRole('dialog');
  await userEvent.click(within(dialog).getByRole('option', { name: /^Dinner/ }));
  await expect.poll(async () => (await logged()).filter((f) => f.loggedMeal?.key === 'k1').map((f) => f.meal)).toEqual(['dinner', 'dinner', 'dinner']);
});

it('MM-634: chosen foods deleted together come back together with Undo', async () => {
  await startFrom('Rice');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Salad · 80 kcal' }));
  await change('2 foods', 'Delete');
  await expect.poll(async () => (await logged()).map((f) => f.name)).toEqual(['Salmon', 'Apple']);
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await logged()).map((f) => f.name).sort()).toEqual(['Apple', 'Rice', 'Salad', 'Salmon']);
});

it('MM-634: Done stops choosing and changes nothing', async () => {
  await startFrom('Salmon');
  await userEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(screen.queryByRole('checkbox', { name: 'Salmon · 400 kcal' })).not.toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Edit Salmon' })).toHaveFocus();
});
