import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { HandModel } from '../../src/domain/food/hand/HandModel';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { portionSummary } from '../../src/format/portionSummary';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-42: finding a food in the installed packs, choosing an amount and
 * logging it. The packs are the fixture pack, on the phone and offline.
 * Carried over from food_search_test.dart and hand_portion_summary_test.dart.
 */
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

async function openSheet({ packs = true }: { packs?: boolean } = {}): Promise<HTMLElement> {
  renderApp(repos, today, packs ? { change: withCatalog(catalog) } : {});
  await openTab('Food');
  return openAddFood();
}

async function pickBanana(sheet: HTMLElement): Promise<void> {
  await typeIn(sheet, 'Search foods', 'banana');
  await userEvent.click((await within(sheet).findAllByRole('button', { name: /Banana/ }))[0] as HTMLElement);
  await within(sheet).findByRole('button', { name: 'Log it' });
}

const only = async () => {
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  return (await first(repos.food.watchFood(today)))[0];
};

it('a searched food is logged by serving with scaled macros', async () => {
  const sheet = await openSheet();
  await typeIn(sheet, 'Search foods', 'banana');
  expect((await within(sheet).findAllByText(/Reference/)).length).toBeGreaterThan(0);
  await pickBanana(sheet);
  await typeIn(sheet, 'How many servings', '2');
  // 2 x 118 g at 89 kcal per 100 g.
  expect(within(sheet).getByText(/210 kcal/)).toBeInTheDocument();
  await press(sheet, 'Log it');
  const entry = await only();
  expect(entry?.name).toBe('Banana');
  expectClose(entry?.kcal ?? 0, 210.04, 0.01);
  expect(entry?.source).toBe('householdMeasure');
});

it('a food can be logged by palm, recorded as a hand portion', async () => {
  const sheet = await openSheet();
  await pickBanana(sheet);
  await press(sheet, 'Palms');
  // MM-217: a hand portion is never presented as exact.
  expect(within(sheet).getByText(/\(estimated\)/)).toBeInTheDocument();
  expect(within(sheet).getByTestId('amount-macros').textContent?.startsWith('Estimated: ')).toBe(true);
  await press(sheet, 'Log it');
  const entry = await only();
  expect(entry?.source).toBe('palm');
  expect(entry?.portion?.unit).toBe('palm');
  expect(entry?.portion?.impliedGrams ?? 0).toBeGreaterThan(50);
  expect(entry?.portion?.handModelVersion).toBe(HandModel.version);
  expectClose(entry?.kcal ?? 0, (89 * (entry?.portion?.impliedGrams ?? 0)) / 100, 0.01);
  expect(entry === undefined ? '' : portionSummary(entry).toLowerCase()).toContain('estimat');
});

it('with nothing found the sheet offers manual entry', async () => {
  const sheet = await openSheet();
  await typeIn(sheet, 'Search foods', 'zzzzq');
  expect(await within(sheet).findByText(/Nothing found/)).toBeInTheDocument();
  await enterManually(sheet);
  expect(within(sheet).getByRole('textbox', { name: /^Calories/ })).toBeInTheDocument();
});

it('with no pack installed it says where to get one', async () => {
  const sheet = await openSheet({ packs: false });
  await typeIn(sheet, 'Search foods', 'banana');
  expect(await within(sheet).findByText(/No food database is on this phone/)).toBeInTheDocument();
});
