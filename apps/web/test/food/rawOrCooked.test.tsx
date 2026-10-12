import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-151: weighing a cooked food against a raw entry is the biggest
 * avoidable error, so a food with both states offers a switch while
 * logging by weight. Carried over from raw_or_cooked_test.dart.
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

async function search(sheet: HTMLElement, query: string, name: RegExp): Promise<void> {
  await typeIn(sheet, 'Search foods', query);
  await userEvent.click((await within(sheet).findAllByRole('button', { name }))[0] as HTMLElement);
  await within(sheet).findByRole('button', { name: 'Log it' });
}

async function pick(query: string, name: RegExp): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  const sheet = await openAddFood();
  await search(sheet, query, name);
  return sheet;
}

const rice = /^White rice, cooked/;
const logged = () => first(repos.food.watchFood(today));
const totals = (sheet: HTMLElement) => within(sheet).getByTestId('amount-macros').textContent ?? '';

async function log(sheet: HTMLElement, count = 1): Promise<void> {
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(count);
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
}

it('rice weighed cooked can be switched to raw, with both shown', async () => {
  const sheet = await pick('white rice', rice);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '200');
  expect(within(sheet).getByText('Weighed as')).toBeInTheDocument();
  expect(
    within(sheet).getByText('200 g cooked is about 260 kcal. 200 g raw is about 730 kcal.'),
  ).toBeInTheDocument();
  expect(totals(sheet)).toContain('260 kcal ·');
  await press(sheet, 'Raw');
  expect(totals(sheet)).toContain('730 kcal ·');
  await log(sheet);
  const entry = (await logged())[0];
  expect(entry?.name).toBe('White rice, raw');
  expectClose(entry?.kcal ?? 0, 730, 1e-9);
  expect(entry?.portion?.reference?.nutrition.kcal).toBe(365);
});

it('the state last used is preselected next time', async () => {
  let sheet = await pick('white rice', rice);
  await press(sheet, 'Grams');
  await press(sheet, 'Raw');
  await log(sheet);
  sheet = await openAddFood();
  await search(sheet, 'white rice', rice);
  // 100 g of the raw entry (365 kcal), not the cooked one (130).
  expect(within(sheet).getByText('Weighed as')).toBeInTheDocument();
  expect(totals(sheet)).toContain('365 kcal ·');
});

it('a cooked food can add its cooking oil as a second entry', async () => {
  const sheet = await pick('white rice', rice);
  expect(within(sheet).getByText('Cooked with oil?')).toBeInTheDocument();
  await press(sheet, '1 tsp');
  await log(sheet, 2);
  const entries = await logged();
  const oil = entries.find((e) => e.name === 'Cooking oil');
  expect(oil).toBeDefined();
  expectClose(oil?.kcal ?? 0, 40, 1);
  expect(oil?.fatG).toBe(4.5);
  expect(oil?.meal).toBe(entries[0]?.meal);
});

it('no oil question for a raw or packaged food', async () => {
  const sheet = await pick('banana', /Banana/);
  expect(within(sheet).queryByText('Cooked with oil?')).not.toBeInTheDocument();
});

it('a serving logs the food as picked, not the raw one (MM-170)', async () => {
  const sheet = await pick('white rice', rice);
  await press(sheet, 'Grams');
  await press(sheet, 'Raw');
  // Back to the cup: a cup of cooked rice, not a cup of raw rice.
  await press(sheet, /1 cup/);
  expect(within(sheet).queryByText('Weighed as')).not.toBeInTheDocument();
  await log(sheet);
  const entry = (await logged())[0];
  expect(entry?.name).toBe('White rice, cooked');
  expectClose(entry?.kcal ?? 0, (130 * 158) / 100, 0.01);
});

it('no switch for a serving, or for a food with one state', async () => {
  const sheet = await pick('white rice', rice);
  expect(within(sheet).queryByText('Weighed as'), 'a serving').not.toBeInTheDocument();
  await press(sheet, 'Back to search');
  await search(sheet, 'banana', /Banana/);
  await press(sheet, 'Grams');
  expect(within(sheet).queryByText('Weighed as'), 'one state only').not.toBeInTheDocument();
});
