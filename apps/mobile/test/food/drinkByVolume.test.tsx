import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-651: a drink the pack states per 100 mL (MM-650) is logged by its own
 * can, by the fluid ounce or the millilitre, exactly; by weight only when it
 * has a density. The rows and the entry say "per 100 mL".
 */
const today = CalendarDate.of(2026, 10, 27);
const mlPerFluidOunce = 29.5735295625;
let repos: InMemoryRepositories;
let catalog: FoodCatalog;

const drink = (id: number, name: string, extras: { kcal: number; density?: number; serving: string; ml: number; sodium?: number }): PackEntry => ({
  food: new CatalogFood({
    id,
    packId: FixturePack.packId,
    name,
    brand: 'Test Brand',
    basis: 'per100ml',
    kcal: extras.kcal,
    proteinG: 0,
    carbsG: extras.kcal / 4,
    fatG: 0,
    sodiumMg: extras.sodium,
    densityGPerMl: extras.density,
    preparation: 'packaged',
    source: 'fixture',
    sourceId: `fixture-${id}`,
    tier: 'label',
    tierReason: 'Test data, not a nutrition source.',
  }),
  servings: [{ description: extras.serving, milliliters: extras.ml }],
});

beforeAll(async () => {
  catalog = await fixtureCatalog(FixturePack.header, [
    ...FixturePack.entries,
    drink(101, 'Cola, classic', { kcal: 42, serving: '1 can (355 mL)', ml: 355, sodium: 4 }),
    drink(102, 'Oat drink, barista', { kcal: 60, density: 1.03, serving: '1 cup (240 mL)', ml: 240 }),
  ]);
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function search(query: string): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', query);
  return sheet;
}

async function pick(query: string, name: RegExp): Promise<HTMLElement> {
  const sheet = await search(query);
  const results = await within(sheet).findAllByRole('button', { name });
  await userEvent.click(results.find((row) => !/Your recent food|From your log/.test(row.textContent ?? '')) ?? (results[0] as HTMLElement));
  await within(sheet).findByRole('button', { name: 'Log it' });
  return sheet;
}

const chip = (sheet: HTMLElement, name: string | RegExp) => within(sheet).queryByRole('button', { name });

it('MM-651: a can of cola is a label serving of 149 kcal, calculated per 100 mL; no weight without a density', async () => {
  const sheet = await pick('cola classic', /^Cola, classic/);
  expect(chip(sheet, '1 can (355 mL)'), 'the serving, its millilitres not repeated').toBeInTheDocument();
  for (const name of ['Fluid ounces', 'Milliliters', 'Cups', 'Tablespoons', 'Teaspoons']) expect(chip(sheet, name), name).toBeInTheDocument();
  for (const name of ['Grams', 'Ounces', 'Palms', 'Cupped hands', 'Thumbs']) expect(chip(sheet, name), name).not.toBeInTheDocument();
  expect(within(sheet).getByTestId('amount-macros').textContent).toMatch(/^Logs 149 kcal/);
  expect(within(sheet).getByText('355 mL'), 'the helper says the volume, since there is no weight').toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  const [can] = await first(repos.food.watchFood(today));
  expectClose(can?.kcal, 149.1, 1e-9);
  expectClose(can?.sodiumMg, 4 * 3.55, 1e-9);
  expect(can?.source).toBe('labelServing');
  expect(can?.portion?.unit).toBe('serving');
  expect(can?.portion?.reference?.basis).toBe('per100ml');
  expect(can?.portion?.reference?.servingMilliliters).toBe(355);
  expect(can?.portion?.reference?.servingGrams).toBeUndefined();
});

it('MM-651: twelve fluid ounces of cola, exact, a household measure', async () => {
  const sheet = await pick('cola classic', /^Cola, classic/);
  await press(sheet, 'Fluid ounces');
  expect(within(sheet).getByRole('textbox', { name: /^Amount/ })).toHaveValue('8');
  await typeIn(sheet, /^Amount/, '12');
  expect(within(sheet).getByText('355 mL')).toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  const [glass] = await first(repos.food.watchFood(today));
  expectClose(glass?.kcal, (42 * 12 * mlPerFluidOunce) / 100, 1e-9);
  expect(glass?.source).toBe('householdMeasure');
  expect(glass?.portion?.unit).toBe('fluidOunce');
});

it('MM-651: a serving changed to fluid ounces is the same portion, said so', async () => {
  const sheet = await pick('cola classic', /^Cola, classic/);
  await typeIn(sheet, 'How many servings', '1');
  await press(sheet, 'Fluid ounces');
  expect(within(sheet).getByRole('textbox', { name: /^Amount/ })).toHaveValue('12');
  expect(within(sheet).getByText('Same amount as 1 × 1 can (355 mL).')).toBeInTheDocument();
  await press(sheet, 'Milliliters');
  expect(within(sheet).getByRole('textbox', { name: /^Amount/ })).toHaveValue('355');
});

it('MM-651: a drink with a density offers grams, and says its cup in grams', async () => {
  const sheet = await pick('oat drink', /^Oat drink, barista/);
  expect(chip(sheet, 'Grams')).toBeInTheDocument();
  expect(chip(sheet, 'Ounces')).toBeInTheDocument();
  expect(within(sheet).getByText('247 g'), '240 mL at 1.03 g/mL').toBeInTheDocument();
  await press(sheet, 'Grams');
  expect(within(sheet).getByRole('textbox', { name: /^Amount/ })).toHaveValue('100');
  expect(within(sheet).getByTestId('amount-macros').textContent).toMatch(/^Logs 58 kcal/);
});

it('MM-651: a found drink’s row says its can and its calories per 100 mL', async () => {
  const sheet = await search('cola classic');
  const [row] = await within(sheet).findAllByRole('button', { name: /^Cola, classic/ });
  expect(row?.textContent).toContain('1 can (355 mL) · 149 kcal (42 per 100 mL)');
});

it('MM-651: a logged can opened again offers its serving and every volume, no weight, per 100 mL', async () => {
  const sheet = await pick('cola classic', /^Cola, classic/);
  await press(sheet, 'Log it');
  await userEvent.click(await screen.findByRole('button', { name: /^Edit Cola, classic/ }));
  const edit = await screen.findByRole('dialog', { name: 'Edit food' });
  expect(chip(edit, '1 can (355 mL)')).toBeInTheDocument();
  for (const name of ['Fluid ounces', 'Milliliters', 'Cups']) expect(chip(edit, name), name).toBeInTheDocument();
  expect(chip(edit, 'Grams')).not.toBeInTheDocument();
  expect(within(edit).getByText(/^Per 100 mL: 42 kcal/)).toBeInTheDocument();
});
