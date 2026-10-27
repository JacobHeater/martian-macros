import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { SqlRepositories } from '../../src/data/SqlRepositories';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import type { AppServices } from '../../src/state/AppServices';
import { foodSheet, openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { onlineSource } from '../support/onlineFixtures';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-654, the way the owner found it: the grade of a drink as the phone
 * shows it, not as a hand-built entry gives it. The soda is found and
 * logged by the fluid ounce through the real screens, kept and read back
 * through the real database code, the app opened again over that database,
 * and the entry edited and saved; the letter is read off the Food row each
 * time. A test that fed the engine a shape the app never stores passed
 * while the phone showed the question mark (the owner, 2026-10-27).
 */
const today = CalendarDate.of(2026, 10, 27);
const slowly = { timeout: 15000 };
let repos: InMemoryRepositories;
let sql: SqlRepositories;
let catalog: FoodCatalog;

/** An orange soda as a US label states it per 100 mL: sugars and sodium stated, fiber 0, no density. */
const soda: PackEntry = {
  food: new CatalogFood({
    id: 103,
    packId: FixturePack.packId,
    name: 'Orange soda',
    brand: 'Test Brand',
    basis: 'per100ml',
    kcal: 54,
    proteinG: 0,
    carbsG: 14.4,
    fatG: 0,
    fiberG: 0,
    sodiumMg: 15,
    micros: { sugars: 14.4 },
    preparation: 'packaged',
    source: 'fixture',
    sourceId: 'fixture-103',
    tier: 'label',
    tierReason: 'Test data, not a nutrition source.',
  }),
  servings: [{ description: '1 can (355 mL)', milliliters: 355 }],
};

/**
 * The same soda as a web service answers with it (MM-58): per 100 g as the online path still keeps it, its
 * serving's millilitres taken as grams with the volume in its words (as Open Food Facts' come, MM-636), and
 * neither fiber nor sugars stated, as the owner's entry was.
 */
const onlineSoda: PackEntry = {
  food: new CatalogFood({
    id: 0,
    packId: 'online',
    name: 'CRUSH, SODA, ORANGE, ORANGE',
    brand: 'CRUSH',
    kcal: 54,
    proteinG: 0,
    carbsG: 14.4,
    fatG: 0,
    sodiumMg: 15,
    source: 'usda_branded',
    sourceId: '2000001',
    tier: 'label',
    tierReason: 'Test data, not a nutrition source.',
  }),
  servings: [{ description: '12 fl oz', grams: 355 }],
};

beforeAll(async () => {
  catalog = await fixtureCatalog(FixturePack.header, [...FixturePack.entries, soda]);
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  // The food log is the real database, the one the phone keeps; everything else stays in memory.
  sql = await SqlRepositories.open(await WasmSqlDatabase.open());
});

/**
 * The app over the in-memory stores, with the food log in the real database. The pack case swaps in the fixture
 * catalog; the online case keeps the app's own, which holds the foods kept from online (MM-58), as the phone's does.
 */
const open = ({ online = false }: { online?: boolean } = {}) =>
  renderApp(repos, today, {
    change: (services: AppServices) =>
      online
        ? { ...services, food: sql.food, onlineSources: [onlineSource([onlineSoda])] }
        : withCatalog(catalog)({ ...services, food: sql.food }),
  });

const gradeOnTheRow = () => screen.findByRole('button', { name: /^Grade D for Orange soda/ }, slowly);
const noGradeOnTheRow = () => screen.queryByRole('button', { name: /^No grade for Orange soda/ });

it('MM-654: four fluid ounces of soda, logged on the phone, kept, reopened and edited, show a D on the row every time', async () => {
  open();
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', 'orange soda');
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Database' }));
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Orange soda/ }, slowly));
  await within(sheet).findByRole('button', { name: 'Log it' }, slowly);
  await press(sheet, 'Fluid ounces');
  await typeIn(sheet, /^Amount/, '4');
  await press(sheet, 'Log it');

  // Logged: the row has its letter, read from the entry as the database gives it back.
  await expect.poll(async () => (await first(sql.food.watchFood(today))).length, slowly).toBe(1);
  const [logged] = await first(sql.food.watchFood(today));
  expect(logged?.portion?.unit).toBe('fluidOunce');
  expect(logged?.portion?.reference?.basis).toBe('per100ml');
  expect(logged?.portion?.reference?.servingGrams).toBeUndefined();
  expect(await gradeOnTheRow()).toBeInTheDocument();
  expect(noGradeOnTheRow()).toBeNull();

  // Reopened: the app starts again over the same database.
  cleanup();
  open();
  await openTab('Food');
  expect(await gradeOnTheRow()).toBeInTheDocument();
  expect(noGradeOnTheRow()).toBeNull();

  // Edited: the amount changed and saved through the edit sheet, which rebuilds the portion.
  await userEvent.click(await screen.findByRole('button', { name: /^Edit Orange soda/ }, slowly));
  const edit = await foodSheet('Edit food');
  await typeIn(edit, /^Amount/, '6');
  await press(edit, 'Save changes');
  await expect.poll(async () => (await first(sql.food.watchFood(today)))[0]?.portion?.quantity, slowly).toBe(6);
  expect(await gradeOnTheRow()).toBeInTheDocument();
  expect(noGradeOnTheRow()).toBeNull();
});

it('MM-656, MM-657: a soda found online with no fiber or sugars stated, logged by the fluid ounce, shows a C on the row (its sugars unstated, so not counted) and says its source when edited', async () => {
  await repos.preferences.saveOnlineLookup('always');
  open({ online: true });
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', 'crush');
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Online' }));
  await press(sheet, 'Search online');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^CRUSH, SODA, ORANGE, ORANGE/ }, slowly));
  await within(sheet).findByRole('button', { name: 'Log it' }, slowly);
  await press(sheet, 'Fluid ounces');
  await typeIn(sheet, /^Amount/, '4');
  await press(sheet, 'Log it');

  await expect.poll(async () => (await first(sql.food.watchFood(today))).length, slowly).toBe(1);
  const [glass] = await first(sql.food.watchFood(today));
  expect(glass?.portion?.unit).toBe('fluidOunce');
  expect(glass?.portion?.reference?.basis).toBe('per100g');
  expect(glass?.portion?.reference?.servingGrams).toBe(355);
  expect(glass?.portion?.reference?.servingMilliliters).toBeCloseTo(12 * 29.5735295625, 6);
  expect(glass?.fiberG).toBeUndefined();
  expect(Math.round(glass?.kcal ?? 0)).toBe(64);
  expect(await screen.findByRole('button', { name: /^Grade C for CRUSH, SODA, ORANGE, ORANGE/ }, slowly)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^No grade for CRUSH/ })).toBeNull();

  // The popover says fiber was counted as none; the edit sheet says where the numbers came from.
  await userEvent.click(screen.getByRole('button', { name: /^Grade C for CRUSH, SODA, ORANGE, ORANGE/ }));
  const sentence = await screen.findByText(/Fiber isn’t stated for this food, so none was counted/);
  // Its own popover's Got it: another "Got it" may stand on the screen behind it.
  await userEvent.click(within(sentence.closest('[role="dialog"]') as HTMLElement).getByRole('button', { name: 'Got it' }));
  await userEvent.click(await screen.findByRole('button', { name: /^Edit CRUSH, SODA, ORANGE, ORANGE/ }, slowly));
  const edit = await foodSheet('Edit food');
  expect(within(edit).getByText('Source: Manufacturer label (USDA), found online.')).toBeInTheDocument();
  // The grade on the edit sheet (MM-659, the owner), the row's letter.
  expect(within(edit).getByRole('button', { name: /^Grade C for CRUSH, SODA, ORANGE, ORANGE/ })).toBeInTheDocument();
  // The entry's own unit is among the chips, chosen (MM-658): the sheet offered cups and spoons and no fluid ounces.
  expect(within(edit).getByRole('button', { name: 'Fluid ounces' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(edit).getByRole('textbox', { name: /^Amount/ })).toHaveValue('4');
});
