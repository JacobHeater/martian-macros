import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openAddFood, press } from '../support/addFood';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-707: the add-food sheet's Saved step picks; the Library manages. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const bar = () =>
  new CustomFood({
    id: 0,
    name: 'Protein bar',
    kind: 'food',
    servingDescription: '1 bar',
    servingGrams: 30,
    perServing: new NutritionTotals({ kcal: 120, proteinG: 10, carbsG: 12, fatG: 4 }),
  });

async function openSaved(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Saved');
  return sheet;
}

it('picking a saved food opens its amount step, as before', async () => {
  await repos.customFoods.saveCustomFood(bar());
  const sheet = await openSaved();
  await press(sheet, /^Protein bar/);
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).map((f) => [f.name, f.kcal])).toEqual([['Protein bar', 120]]);
});

it('nothing is managed here: no menus, no New food or New recipe, and Manage in Library is offered', async () => {
  await repos.customFoods.saveCustomFood(bar());
  const sheet = await openSaved();
  await within(sheet).findByRole('button', { name: /^Protein bar/ });
  expect(within(sheet).queryByRole('button', { name: /^More actions for/ })).not.toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'New food' })).not.toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'New recipe' })).not.toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Manage in Library' })).toBeInTheDocument();
});

it('Manage in Library closes the sheet and opens the Library', async () => {
  const sheet = await openSaved();
  expect(within(sheet).getByText('Nothing saved yet. Make a food in the Library.')).toBeInTheDocument();
  await press(sheet, 'Manage in Library');
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add food' })).toBeNull());
  expect(await within(topLayer()).findByRole('heading', { name: 'Library' })).toBeInTheDocument();
  // Back returns to Food.
  await press(topLayer(), 'Back');
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Library' })).toBeNull());
  expect(screen.getByRole('navigation', { name: 'Destinations' })).toBeInTheDocument();
});
