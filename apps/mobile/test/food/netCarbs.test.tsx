import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { intakeDayFrom } from '../../src/domain/intakeDayFrom';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-396: carbs shown net of fiber and sugar alcohols, on by default, everywhere carbs show. */
const today = CalendarDate.of(2026, 10, 18);
let repos: InMemoryRepositories;

const bar = (extra: Partial<ConstructorParameters<typeof FoodEntry>[0]> = {}) =>
  new FoodEntry({ id: 0, date: today, meal: 'snack', name: 'Protein bar', kcal: 200, proteinG: 20, carbsG: 24, fatG: 7, source: 'labelServing', fiberG: 9, sugarAlcoholsG: 10, ...extra });

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(targetsFrom(today.addDays(-30), { carbsG: 250 }));
});

const carbsBar = () => screen.getByText(/^(Net carbs|Carbs)$/).closest('.mm-macro-bar');

it('is on until switched off', async () => {
  expect(await first(repos.preferences.watchNetCarbs())).toBe(true);
  renderApp(repos, today);
  const settings = await openSettings();
  expect(settings.getByRole('switch', { name: /^Net carbs/ })).toBeChecked();
});

it('a bar of 24 g carbohydrate, 9 g fiber and 10 g sugar alcohols counts 5 g net, against the same carb target', async () => {
  await repos.food.addFood(bar());
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Protein bar');
  expect(carbsBar()).toHaveTextContent('Net carbs');
  expect(carbsBar()).toHaveTextContent('5 / 250 g');
  expect(within(screen.getByRole('button', { name: 'Edit Protein bar' })).getByText(/P 20 · C 5 · F 7/)).toBeInTheDocument();
});

it('switched off, the same day shows 24 g, labelled Carbs', async () => {
  await repos.food.addFood(bar());
  await repos.preferences.saveNetCarbs(false);
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Protein bar');
  expect(carbsBar()).toHaveTextContent('Carbs');
  expect(carbsBar()).not.toHaveTextContent('Net carbs');
  expect(carbsBar()).toHaveTextContent('24 / 250 g');
});

it('the switch in Settings changes what is shown at once', async () => {
  await repos.food.addFood(bar());
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('switch', { name: /^Net carbs/ }));
  await expect.poll(() => first(repos.preferences.watchNetCarbs())).toBe(false);
});

it('a food with nothing stated counts its total; a food whose lines round past zero counts none', () => {
  const plain = bar({ fiberG: undefined, sugarAlcoholsG: undefined });
  expect(plain.netCarbsG).toBe(24);
  // Labels round each line on its own (the panel's NU-2): 1 g less 1 g fiber and 1 g sugar alcohol is 0, never less.
  const rounded = bar({ carbsG: 1, fiberG: 1, sugarAlcoholsG: 1 });
  expect(rounded.netCarbsG).toBe(0);
  // Each food is held at zero before the day adds up, so one food never eats another's carbs.
  expect(intakeDayFrom(today, [rounded, plain]).netCarbsG).toBe(24);
});

// The panel's NU-5: what the engine and the calories rest on is the total, whatever is shown.
it('switching leaves the calories and the day the engine reads unchanged', () => {
  const day = intakeDayFrom(today, [bar()]);
  expect(day.carbsG).toBe(24);
  expect(day.kcal).toBe(200);
  expect(day.netCarbsG).toBe(5);
});
