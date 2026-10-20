import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { foodOn } from '../support/foodOn';
import { hasPreview, macroGrams, macroLine, sectors } from '../support/macroPreview';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** The macro split of a food before it is logged. Carried over from add_food_macro_split_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let catalog: FoodCatalog;

beforeAll(async () => {
  catalog = await fixtureCatalog();
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function open(): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  return openAddFood();
}

async function pickFromSearch(sheet: HTMLElement, query: string, name: RegExp): Promise<void> {
  await typeIn(sheet, 'Search foods', query);
  await userEvent.click((await within(sheet).findAllByRole('button', { name }))[0] as HTMLElement);
  await within(sheet).findByRole('button', { name: 'Log it' });
}

it('manual split updates using food energy, not calories or targets', async () => {
  const sheet = await open();
  expect(hasPreview(sheet)).toBe(false);
  await enterManually(sheet);
  await typeIn(sheet, 'Protein g', '100');
  await typeIn(sheet, 'Carbs g', '150');
  await typeIn(sheet, 'Fat g', '50');
  await typeIn(sheet, /^Calories/, '2000');
  expect(sectors(sheet)).toEqual([400, 600, 450]);
  expect(macroLine(sheet, 'Protein')).toBe('100 g · 27.6%');
  expect(macroLine(sheet, 'Net carbs')).toBe('150 g · 41.4%');
  expect(macroLine(sheet, 'Fat')).toBe('50 g · 31.0%');

  await typeIn(sheet, 'Protein g', '50');
  expect(sectors(sheet)).toEqual([200, 600, 450]);
  expect(await first(repos.food.watchFood(today))).toEqual([]);
});

it('serving basis scales chart grams and invalid values hide it', async () => {
  const sheet = await open();
  await enterManually(sheet);
  await typeIn(sheet, 'Protein g', '20');
  await typeIn(sheet, 'Servings eaten', '2');
  expect(sectors(sheet)).toEqual([160]);
  expect(macroGrams(sheet, 'Protein')).toBe(40);

  await typeIn(sheet, 'Servings eaten', '0');
  expect(hasPreview(sheet)).toBe(false);
  await typeIn(sheet, 'Servings eaten', '1');
  await typeIn(sheet, 'Protein g', '-1');
  expect(hasPreview(sheet)).toBe(false);
});

it('calories without macros do not invent a split', async () => {
  const sheet = await open();
  await enterManually(sheet);
  await typeIn(sheet, /^Calories/, '500');
  expect(sectors(sheet)).toEqual([]);
  expect(within(sheet).getByText(/Enter macro amounts to preview/)).toBeInTheDocument();
});

it('recent entry preview starts from its saved macro totals', async () => {
  await repos.food.addFood(
    foodOn(today, { name: 'Recent soup', meal: 'lunch', kcal: 400, proteinG: 20, carbsG: 30, fatG: 10 }),
  );
  const sheet = await open();
  await press(sheet, 'Recent soup');
  expect(sectors(sheet)).toEqual([80, 120, 90]);
});

it('found food amount updates and invalid amounts hide the split', async () => {
  const sheet = await open();
  await pickFromSearch(sheet, 'Banana', /Banana/);
  const initial = sectors(sheet);
  expect(initial).toHaveLength(3);
  await typeIn(sheet, /^(How many servings|Amount)/, '2');
  sectors(sheet).forEach((energy, i) => expectClose(energy, (initial[i] ?? 0) * 2, 1e-9));
  await typeIn(sheet, /^(How many servings|Amount)/, '');
  expect(hasPreview(sheet)).toBe(false);
});

it('meal estimate preview changes with meal kind and size', async () => {
  const sheet = await open();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Estimate' }));
  expect(await within(sheet).findByText('Estimated macro split')).toBeInTheDocument();
  const total = () => sectors(sheet).reduce((sum, energy) => sum + energy, 0);
  const initialProtein = macroGrams(sheet, 'Protein');
  await press(sheet, 'Mostly protein (meat or fish)');
  expect(macroGrams(sheet, 'Protein')).toBeGreaterThan(initialProtein);
  const before = total();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Large · about/ }));
  expect(total()).toBeGreaterThan(before);
});

it('the split is the food\'s own: cooking oil is its own entry, and raw changes the food (the WS-08 panel, MM-152)', async () => {
  const sheet = await open();
  await pickFromSearch(sheet, 'white rice', /^White rice, cooked/);
  await press(sheet, 'Grams');
  const [protein, carbs, fat] = sectors(sheet);
  await press(sheet, '1 tsp');
  // The oil is logged beside the rice, so the rice's split does not take it in.
  expect(sectors(sheet)).toEqual([protein, carbs, fat]);
  expect(within(sheet).getByText(/as its own entry: about \d+ kcal/)).toBeInTheDocument();

  await press(sheet, 'Raw');
  const raw = sectors(sheet);
  expect(raw[0]).toBe(28);
  expect(raw[1]).toBe(320);
  expectClose(raw[2] ?? 0, 6.3, 1e-9);
  // Raw rice is still cooked in something: the question stays.
  expect(within(sheet).getByText('Cooked with oil?')).toBeInTheDocument();
});
