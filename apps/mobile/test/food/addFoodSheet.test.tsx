import { screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { Meal } from '../../src/domain/Meal';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/**
 * MM-190: the meal a new entry starts in follows the app's clock, not the
 * device's. Carried over from default_meal_follows_clock_test.dart.
 */
const hours: readonly (readonly [number, Meal])[] = [
  [8, 'breakfast'],
  [12, 'lunch'],
  [19, 'dinner'],
  [22, 'snack'],
];
for (const [hour, meal] of hours) {
  it(`food added at ${hour}:00 starts in ${meal}`, async () => {
    renderApp(repos, today, { hour });
    const sheet = await openAddFood();
    await enterManually(sheet);
    await typeIn(sheet, 'Food name', 'Eggs');
    await typeIn(sheet, 'Protein g', '12');
    await press(sheet, 'Log it');
    await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
    expect((await first(repos.food.watchFood(today)))[0]?.meal).toBe(meal);
  });
}

/** MM-216: changing how a food was measured clears the amount, and the form says so. From add_food_method_change_test.dart. */
it('changing the method says the amount has to be entered again', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await enterManually(sheet);
  // The sheet opens on Label serving with one serving.
  await typeIn(sheet, 'Servings eaten', '1.5');
  await press(sheet, 'Weighed');
  expect(within(sheet).getByText(/Enter how much again/)).toBeInTheDocument();
});

/** Finding a food and typing one are separate steps. Carried over from add_food_discovery_test.dart. */
it('discovery and manual entry are separate steps', async () => {
  await repos.food.addFood(
    foodOn(today, { name: 'Oats with milk', meal: 'lunch', kcal: 300, proteinG: 12, carbsG: 45, fatG: 8 }),
  );
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  const inSheet = within(sheet);
  const search = () => inSheet.queryByRole('textbox', { name: 'Search foods' });
  const name = () => inSheet.queryByRole<HTMLInputElement>('textbox', { name: 'Food name' });

  expect(search()).toBeInTheDocument();
  expect(inSheet.getByText('Recent foods')).toBeInTheDocument();
  expect(inSheet.getByRole('button', { name: /^Oats with milk/ })).toBeInTheDocument();
  expect(inSheet.getByRole('button', { name: 'Enter manually' })).toBeInTheDocument();
  expect(name()).not.toBeInTheDocument();
  expect(inSheet.queryByRole('textbox', { name: 'Protein g' })).not.toBeInTheDocument();
  expect(inSheet.queryByRole('button', { name: 'Log it' })).not.toBeInTheDocument();

  await enterManually(sheet);
  expect(search()).not.toBeInTheDocument();
  expect(name()).toBeInTheDocument();
  expect(inSheet.getByRole('textbox', { name: 'Protein g' })).toBeInTheDocument();
  // "Estimate" is also one of the ways a food was measured, so it is not looked for here.
  for (const way of ['Scan', 'Saved']) {
    expect(inSheet.queryByRole('button', { name: way })).not.toBeInTheDocument();
  }

  await typeIn(sheet, 'Food name', 'Homemade soup');
  await press(sheet, 'Back to food choices');
  expect(search()).toBeInTheDocument();
  expect(name()).not.toBeInTheDocument();
  expect(inSheet.getByText('Recent foods')).toBeInTheDocument();

  // What was typed is still there on coming back.
  await enterManually(sheet);
  expect(name()).toHaveValue('Homemade soup');

  await press(sheet, 'Back to food choices');
  await press(sheet, /^Oats with milk/);
  expect(name()).toHaveValue('Oats with milk');

  await press(sheet, 'Back to food choices');
  await typeIn(sheet, 'Search foods', 'Tuna');
  await enterManually(sheet);
  expect(name()).toHaveValue('Tuna');
});
