import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Meal } from '../../src/domain/Meal';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { mealLabel } from '../../src/format/mealLabel';
import { enterManually, foodSheet, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { macroGrams } from '../support/macroPreview';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** The meals of the Food screen, one card each. Carried over from meal_cards_test.dart. */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function openFood({ populated = false }: { populated?: boolean } = {}): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  if (populated) {
    for (const meal of Meal.values) {
      await repos.food.addFood(
        foodOn(today, { name: `Food for ${meal}`, meal, kcal: 500, proteinG: 30, carbsG: 60, fatG: 16 }),
      );
    }
  }
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('region', { name: 'Breakfast' });
}

const card = (meal: Meal) => screen.getByRole('region', { name: mealLabel(meal) });
const toggle = (meal: Meal) => within(card(meal)).getByRole('button', { name: new RegExp(`^${mealLabel(meal)}`) });
const body = () => document.querySelector<HTMLElement>('.app-body') as HTMLElement;

it('each empty meal has a separate card and an add control with a name', async () => {
  await openFood();
  for (const meal of Meal.values) {
    expect(card(meal).closest('.mm-surface')).not.toBeNull();
    expect(
      within(card(meal)).getByRole('button', { name: `Add food to ${mealLabel(meal).toLowerCase()}` }),
    ).toBeInTheDocument();
  }
  expect(new Set(Meal.values.map((meal) => card(meal).closest('.mm-surface'))).size).toBe(Meal.values.length);
  expect(document.querySelectorAll('.chart-split, .chart-note')).toHaveLength(1);
});

it('meals expand independently and keep their add controls', async () => {
  await openFood({ populated: true });
  expect(screen.getByText('Food for lunch')).toBeVisible();
  await userEvent.click(toggle('lunch'));
  expect(toggle('lunch')).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByText('Food for lunch')).not.toBeVisible();
  expect(within(card('lunch')).getByRole('button', { name: 'Add food to lunch' })).toBeInTheDocument();
  expect(screen.getByText('Food for breakfast')).toBeVisible();
  await userEvent.click(toggle('lunch'));
  expect(screen.getByText('Food for lunch')).toBeVisible();
});

it('the Food split follows the selected day; the Dashboard stays on today', async () => {
  await repos.food.addFood(
    foodOn(today.addDays(-1), { name: 'Yesterday only', meal: 'lunch', kcal: 200, proteinG: 10, carbsG: 20, fatG: 5 }),
  );
  await openFood({ populated: true });
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  await screen.findByText('Yesterday only');
  expect(macroGrams(body(), 'Protein')).toBe(10);
  await openTab('Dashboard');
  await screen.findByRole('heading', { name: 'Logging coverage' });
  expect(macroGrams(body(), 'Protein')).toBe(120);
});

for (const collapsed of [false, true]) {
  it(`Add does not toggle the meal (collapsed: ${collapsed})`, async () => {
    await openFood({ populated: true });
    if (collapsed) await userEvent.click(toggle('breakfast'));
    const add = within(card('breakfast')).getByRole('button', { name: 'Add food to breakfast' });
    expect(add).toHaveClass('mm-icon-button-add');
    expect(add).not.toHaveTextContent('+');
    await userEvent.click(add);
    const sheet = await foodSheet();
    expect(within(sheet).getByRole('textbox', { name: 'Search foods' })).toBeInTheDocument();
    expect(within(sheet).queryByRole('textbox', { name: 'Food name' })).not.toBeInTheDocument();

    // The sheet opened for breakfast: what is logged from it goes there.
    await enterManually(sheet);
    expect(within(sheet).getByRole('button', { name: 'Breakfast' })).toHaveAttribute('aria-pressed', 'true');
    await typeIn(sheet, 'Food name', 'Toast');
    await typeIn(sheet, /^Calories/, '100');
    await press(sheet, 'Log it');
    await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(Meal.values.length + 1);
    expect((await first(repos.food.watchFood(today))).find((e) => e.name === 'Toast')?.meal).toBe('breakfast');

    expect(toggle('breakfast')).toHaveAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (collapsed) expect(screen.getByText('Food for breakfast')).not.toBeVisible();
    else expect(screen.getByText('Food for breakfast')).toBeVisible();
  });
}
