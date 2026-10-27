import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
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

/** Searches and picks the pack's result called `name`, never the recent-food row of the same name. */
async function search(sheet: HTMLElement, query: string, name: RegExp): Promise<void> {
  await typeIn(sheet, 'Search foods', query);
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Database' }));
  const results = await within(sheet).findAllByRole('button', { name });
  const fromPack = results.find((result) => !/Your recent food|From your log/.test(result.textContent ?? '')) ?? results[0];
  await userEvent.click(fromPack as HTMLElement);
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

it('the state last used is preselected next time, and the step says why', async () => {
  let sheet = await pick('white rice', rice);
  await press(sheet, 'Grams');
  await press(sheet, 'Raw');
  await log(sheet);
  sheet = await openAddFood();
  await search(sheet, 'white rice', rice);
  // 100 g of the raw entry (365 kcal), not the cooked one (130).
  expect(within(sheet).getByText('Weighed as')).toBeInTheDocument();
  expect(totals(sheet)).toContain('365 kcal ·');
  expect(within(sheet).getByText(/Starts on raw, as last time\.$/)).toBeInTheDocument();
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

// MM-151: remembered per food, from the whole log, not only the last twenty recent foods.
it('the state last used is remembered past the recent foods', async () => {
  let sheet = await pick('white rice', rice);
  await press(sheet, 'Grams');
  await press(sheet, 'Raw');
  await log(sheet);
  for (let i = 0; i < 25; i++) {
    await repos.food.addFood(
      new FoodEntry({ id: 0, date: today, meal: 'snack', name: `Other food ${i}`, kcal: 50, proteinG: 1, carbsG: 1, fatG: 1, source: 'weighed' }),
    );
  }
  sheet = await openAddFood();
  await search(sheet, 'white rice', rice);
  expect(within(sheet).getByText('Weighed as')).toBeInTheDocument();
  expect(totals(sheet)).toContain('365 kcal ·');
});

// MM-167: the state the food was logged in rides with the entry, and the portion line says it.
it('an entry records whether it was weighed raw or cooked, and the row says so', async () => {
  const sheet = await pick('white rice', rice);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '200');
  await press(sheet, 'Raw');
  await log(sheet);
  const entry = (await logged())[0];
  expect(entry?.portion?.preparation).toBe('raw');
  expect(entry?.portion?.conversion, 'a weight needs no conversion').toBeUndefined();
  expect(await screen.findByText('200 g raw')).toBeInTheDocument();
});

it('a cup of rice records the serving weight it was converted with', async () => {
  const sheet = await pick('white rice', rice);
  await log(sheet);
  const entry = (await logged())[0];
  expect(entry?.portion?.preparation).toBe('cooked');
  expect(entry?.portion?.conversion).toEqual({ kind: 'servingWeight', gramsPerUnit: 158 });
});

// MM-153: the amount step shows what the source states, per 100 g, and nothing invented.
it('the amount step states the numbers per 100 g beside the source and tier', async () => {
  const sheet = await pick('white rice', rice);
  expect(within(sheet).getByText('Per 100 g: 130 kcal · 3 g protein · 28 g carbs · 0 g fat')).toBeInTheDocument();
});

// MM-152: the fat chosen is logged and becomes the usual one.
it('butter chosen as the fat is logged as butter and remembered as the usual', async () => {
  let sheet = await pick('white rice', rice);
  await press(sheet, '1 tsp');
  expect(within(sheet).getByRole('button', { name: 'Oil', pressed: true })).toBeInTheDocument();
  await press(sheet, 'Butter');
  // The Logs line names everything Log it does (the panel's UX-2).
  expect(totals(sheet)).toMatch(/^Logs 205 kcal · 4 g protein · .*0 g fat\. Plus butter as its own entry: about 34 kcal · 4 g fat\.$/);
  await log(sheet, 2);
  const butter = (await logged()).find((e) => e.name === 'Butter');
  expectClose(butter?.kcal ?? 0, 33.7, 0.1);
  expectClose(butter?.fatG ?? 0, 3.81, 0.01);
  expect(await first(repos.preferences.watchUsualCookingFat())).toBe('butter');
  sheet = await openAddFood();
  await search(sheet, 'white rice', rice);
  await press(sheet, '1 tbsp');
  expect(within(sheet).getByRole('button', { name: 'Butter', pressed: true })).toBeInTheDocument();
});

// MM-49: Simple detail says calories and protein on the amount step too; the food is logged whole.
it('at Simple detail the amount step says calories and protein, and logs the whole food', async () => {
  await repos.preferences.saveDetailLevel('simple');
  const sheet = await pick('white rice', rice);
  expect(totals(sheet)).toBe('Logs 205 kcal · 4 g protein');
  expect(within(sheet).queryByText('Macro split')).not.toBeInTheDocument();
  await log(sheet);
  const entry = (await logged())[0];
  expectClose(entry?.carbsG ?? 0, (28 * 158) / 100, 0.01);
});

// The panel's UX-1: the state switch never takes the fat question away; rice weighed raw is still fried.
it('rice weighed raw can still add the butter it was cooked in, and both are logged', async () => {
  const sheet = await pick('white rice', rice);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '200');
  await press(sheet, 'Raw');
  expect(within(sheet).getByText('Cooked with oil?')).toBeInTheDocument();
  await press(sheet, '1 tsp');
  await press(sheet, 'Butter');
  expect(totals(sheet)).toMatch(/^Logs 730 kcal · 14 g protein · .*1 g fat\. Plus butter as its own entry: about 34 kcal · 4 g fat\.$/);
  await log(sheet, 2);
  const entries = await logged();
  expect(entries.map((e) => e.name).sort()).toEqual(['Butter', 'White rice, raw']);
});

it('the raw food of a pair, picked from search, is offered the fat question too', async () => {
  const sheet = await pick('white rice', /^White rice, raw/);
  await press(sheet, 'Grams');
  expect(within(sheet).getByText('Cooked with oil?')).toBeInTheDocument();
});

// MM-49, the panel's UX-10: at Simple the source's line and the fat line say calories and protein too.
it('at Simple detail the reference line and the fat line follow the level', async () => {
  await repos.preferences.saveDetailLevel('simple');
  const sheet = await pick('white rice', rice);
  expect(within(sheet).getByText('Per 100 g: 130 kcal · 3 g protein')).toBeInTheDocument();
  await press(sheet, '1 tsp');
  expect(totals(sheet)).toBe('Logs 205 kcal · 4 g protein. Plus cooking oil as its own entry: about 40 kcal.');
});

// MM-151, MM-167, the panel's PD-3: a packaged food's row says so, and its serving is a label serving.
it('a packaged food logged by its serving says "as packaged" on its row', async () => {
  const sheet = await pick('protein bar', /^Protein bar, chocolate/);
  await log(sheet);
  const entry = (await logged())[0];
  expect(entry?.source).toBe('labelServing');
  expect(entry?.portion?.preparation).toBe('packaged');
  expect(await screen.findByText('1 × 1 bar · 60 g')).toBeInTheDocument();
});
