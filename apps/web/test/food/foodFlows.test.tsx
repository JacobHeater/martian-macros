import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { FoodEntry } from '../../src/domain/FoodEntry';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-93: the Food screen's flows (MM-38, MM-41). Carried over from food_flows_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

const food = (name: string, kcal: number, on: CalendarDate, proteinG = 30) =>
  foodOn(on, { name, meal: 'lunch', kcal, proteinG, carbsG: 40, fatG: 10 });

async function seed({
  history = [],
  foods = [],
}: { history?: readonly TargetsRecord[]; foods?: readonly FoodEntry[] } = {}): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  for (const h of history) await repos.targets.saveTargets(h);
  for (const f of foods) await repos.food.addFood(f);
}

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('button', { name: 'Previous day' });
}

it('energy that disagrees with the macros is flagged', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40))] });
  await openFood();
  const sheet = await openAddFood();
  await enterManually(sheet);
  await typeIn(sheet, 'Protein g', '45');
  await typeIn(sheet, 'Carbs g', '60');
  await typeIn(sheet, 'Fat g', '10');
  await typeIn(sheet, /^Calories/, '200');
  expect(within(sheet).getByText(/Macros add up to 510 kcal/)).toBeInTheDocument();
});

it('swiping an entry deletes it', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40))], foods: [food('Chicken and rice', 510, today)] });
  await openFood();
  const row = await screen.findByText('Chicken and rice');
  fireEvent.pointerDown(row, { clientX: 400 });
  fireEvent.pointerMove(row, { clientX: 150 });
  fireEvent.pointerUp(row, { clientX: 150 });
  await expect.poll(() => screen.queryByRole('button', { name: 'Edit Chicken and rice' })).toBeNull();
  expect(await first(repos.food.watchFood(today))).toEqual([]);
});

it('a short drag is not a deletion', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40))], foods: [food('Chicken and rice', 510, today)] });
  await openFood();
  const row = await screen.findByText('Chicken and rice');
  fireEvent.pointerDown(row, { clientX: 400 });
  fireEvent.pointerMove(row, { clientX: 340 });
  fireEvent.pointerUp(row, { clientX: 340 });
  expect(screen.getByRole('button', { name: 'Edit Chicken and rice' })).toBeInTheDocument();
  expect(await first(repos.food.watchFood(today))).toHaveLength(1);
});

it('food can be logged to a past day', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40))] });
  await openFood();
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  expect(screen.getByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
  const sheet = await openAddFood();
  await enterManually(sheet);
  await typeIn(sheet, 'Food name', 'Pasta');
  await typeIn(sheet, /^Calories/, '600');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today.addDays(-1)))).length).toBe(1);
  expect((await first(repos.food.watchFood(today.addDays(-1))))[0]?.name).toBe('Pasta');
  expect(await first(repos.food.watchFood(today))).toEqual([]);
});

it('being over target is stated plainly', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40))], foods: [food('Big meal', 3000, today)] });
  await openFood();
  expect(await screen.findByText('kcal over 2,400')).toBeInTheDocument();
  expect(screen.getByText('600')).toBeInTheDocument();
});

it('protein shows the minimum and target as separate marks', async () => {
  await seed({
    history: [targetsFrom(today.addDays(-40), { proteinG: 160, proteinMinimumG: 128 })],
    foods: [food('Protein-rich day', 700, today, 135)],
  });
  await openFood();
  const figures = await screen.findByText(/135 g · min 128 · target 160/);
  const markers = figures.closest('.mm-macro-bar')?.querySelectorAll<HTMLElement>('.mm-progress-marker') ?? [];
  expect([...markers].map((marker) => marker.dataset['at'])).toEqual(['0.8', '1']);
});

it('a past day is measured against the targets of that day', async () => {
  await seed({
    history: [targetsFrom(today.addDays(-40)), targetsFrom(today, { kcal: 2000 })],
    foods: [food('Old meal', 1000, today.addDays(-1))],
  });
  await openFood();
  expect(await screen.findByText(/left of 2,000/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  expect(await screen.findByText(/left of 2,400/)).toBeInTheDocument();
  expect(screen.getByText('1,400')).toBeInTheDocument();
});

it('the day picker steps back and returns to today', async () => {
  await seed({ history: [targetsFrom(today.addDays(-40))] });
  await openFood();
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  await userEvent.click(screen.getByRole('button', { name: 'Yesterday' }));
  expect(screen.getAllByText('Today').length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: 'Yesterday' })).not.toBeInTheDocument();
  // There is no tomorrow to step to.
  expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();
});
