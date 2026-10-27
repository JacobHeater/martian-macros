import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { enterManually, foodSheet, openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-167: quantity, unit and what the typed numbers are for, in the
 * add-food sheet, the amount step and the editor. Carried over from
 * food_portion_test.dart.
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

async function openFood(): Promise<void> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  await screen.findByRole('button', { name: 'Previous day' });
}

async function openSheet({ manual = true }: { manual?: boolean } = {}): Promise<HTMLElement> {
  await openFood();
  const sheet = await openAddFood();
  if (manual) await enterManually(sheet);
  return sheet;
}

const logged = () => first(repos.food.watchFood(today));
const only = async () => {
  const entries = await logged();
  expect(entries).toHaveLength(1);
  return entries[0] as FoodEntry;
};

/** Presses the sheet's save and waits for the sheet to go. */
async function save(sheet: HTMLElement, label: 'Log it' | 'Save changes' = 'Log it'): Promise<void> {
  await press(sheet, label);
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
}

const canLog = (sheet: HTMLElement, label = 'Log it') =>
  !within(sheet).getByRole<HTMLButtonElement>('button', { name: label }).disabled;

async function manual(sheet: HTMLElement, name = 'Stew', kcal = '400'): Promise<void> {
  await typeIn(sheet, 'Food name', name);
  await typeIn(sheet, /^Calories/, kcal);
}

/** The amount field, whatever the method calls it. */
const amountField = (sheet: HTMLElement) =>
  within(sheet).queryByRole<HTMLInputElement>('textbox', { name: /^(Servings eaten|Amount|How many)/ });

async function typeAmount(sheet: HTMLElement, text: string): Promise<void> {
  const field = amountField(sheet) as HTMLInputElement;
  await userEvent.clear(field);
  if (text !== '') await userEvent.type(field, text);
}

async function openEntry(name: string): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole('button', { name: `Edit ${name}` }));
  return foodSheet('Edit food');
}

/** Searches the pack for a banana, picks it, and logs 150 g of it. */
async function logBananaByWeight(): Promise<void> {
  const sheet = await openSheet({ manual: false });
  await typeIn(sheet, 'Search foods', 'banana');
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Database' }));
  await userEvent.click((await within(sheet).findAllByRole('button', { name: /Banana/ }))[0] as HTMLElement);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '150');
  expect(within(sheet).getByText(/134 kcal/)).toBeInTheDocument();
  await save(sheet);
}

it('manual servings have no basis switch and scale nutrition (MM-226)', async () => {
  const sheet = await openSheet();
  expect(within(sheet).getByText('Nutrition per serving')).toBeInTheDocument();
  expect(within(sheet).queryByText('Everything I ate')).not.toBeInTheDocument();
  expect(within(sheet).queryByText('One serving')).not.toBeInTheDocument();
  await manual(sheet, 'Bar', '160');
  await typeIn(sheet, 'Protein g', '10');
  await typeAmount(sheet, '2');
  expect(within(sheet).getByText(/Logs 320 kcal/)).toBeInTheDocument();
  await save(sheet);
  const entry = await only();
  expect(entry.kcal).toBe(320);
  expect(entry.proteinG).toBe(20);
  expect(entry.portion?.quantity).toBe(2);
  expect(entry.portion?.basis).toBe('calculated');
});

it('older serving totals reopen without double scaling (MM-226)', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'lunch',
      name: 'Older bar',
      kcal: 400,
      proteinG: 20,
      carbsG: 50,
      fatG: 10,
      source: 'labelServing',
      portion: { method: 'labelServing', basis: 'enteredTotals', quantity: 2, unit: 'serving' },
    }),
  );
  await openFood();
  const sheet = await openEntry('Older bar');
  expect(within(sheet).queryByText('Everything I ate')).not.toBeInTheDocument();
  expect(within(sheet).getByText(/Logs 400 kcal/)).toBeInTheDocument();
  await typeAmount(sheet, '3');
  expect(within(sheet).getByText(/Logs 600 kcal/)).toBeInTheDocument();
  await save(sheet, 'Save changes');
  const entry = await only();
  expect(entry.kcal).toBe(600);
  expect(entry.proteinG).toBe(30);
});

it('Weighed asks for an amount and a weight unit', async () => {
  const sheet = await openSheet();
  await press(sheet, 'Weighed');
  expect(within(sheet).getByRole('button', { name: 'Grams' })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Ounces' })).toBeInTheDocument();
  await manual(sheet);
  expect(canLog(sheet), 'no amount yet').toBe(false);
  expect(within(sheet).getByText('How much did you eat?')).toBeInTheDocument();
  await press(sheet, 'Ounces');
  await typeAmount(sheet, '6');
  expect(canLog(sheet)).toBe(true);
  await save(sheet);
  const entry = await only();
  expect(entry.portion?.quantity).toBe(6);
  expect(entry.portion?.unit).toBe('ounce');
  expect(entry.portion?.method).toBe('weighed');
  expect(entry.portion?.basis).toBe('enteredTotals');
  expect(entry.kcal, 'typed totals are not scaled by 6 oz').toBe(400);
});

it('invalid amounts are refused with a reason', async () => {
  const sheet = await openSheet();
  await press(sheet, 'Weighed');
  await manual(sheet);
  for (const bad of ['0', '-2', 'abc']) {
    await typeAmount(sheet, bad);
    expect(canLog(sheet), bad).toBe(false);
    expect(within(sheet).getByText('An amount above zero is needed.')).toBeInTheDocument();
  }
  await typeAmount(sheet, '1 1/2');
  expect(canLog(sheet), 'a fraction is fine').toBe(true);
});

it('typed totals are never multiplied by the servings', async () => {
  const sheet = await openSheet();
  await press(sheet, 'Weighed');
  await manual(sheet);
  await typeAmount(sheet, '2');
  await save(sheet);
  const entry = await only();
  expect(entry.kcal).toBe(400);
  expect(entry.portion?.quantity).toBe(2);
  expect(entry.portion?.unit).toBe('gram');
  expect(entry.portion?.basis).toBe('enteredTotals');
});

it('one serving as the basis scales the typed numbers', async () => {
  const sheet = await openSheet();
  await manual(sheet, 'Bar', '160');
  await typeIn(sheet, 'Protein g', '10');
  await typeAmount(sheet, '1.5');
  expect(within(sheet).getByText(/Logs 240 kcal/)).toBeInTheDocument();
  await save(sheet);
  const entry = await only();
  expect(entry.kcal).toBe(240);
  expect(entry.proteinG).toBe(15);
  expect(entry.source).toBe('labelServing');
  const p = entry.portion;
  expect(p?.basis).toBe('calculated');
  expect(p?.quantity).toBe(1.5);
  expect(p?.reference?.basis).toBe('perServing');
  expect(p?.reference?.nutrition.kcal).toBe(160);
});

it('cups take a fraction and a volume unit', async () => {
  const sheet = await openSheet();
  await press(sheet, 'Cup / spoon');
  expect(within(sheet).getByRole('button', { name: 'Cups' })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Tablespoons' })).toBeInTheDocument();
  await press(sheet, 'Cups');
  await manual(sheet);
  await typeAmount(sheet, '1/2');
  await save(sheet);
  const p = (await only()).portion;
  expect(p?.quantity).toBe(0.5);
  expect(p?.unit).toBe('cup');
  expect(p?.method).toBe('householdMeasure');
});

it('cupped hands are a count of an estimated portion', async () => {
  const sheet = await openSheet();
  await press(sheet, 'Cupped hand');
  await manual(sheet);
  await typeAmount(sheet, '2');
  await save(sheet);
  const entry = await only();
  expect(entry.portion?.quantity).toBe(2);
  expect(entry.portion?.unit).toBe('cuppedHand');
  expect(entry.kcal).toBe(400);
  expect(await screen.findByText(/^2 cupped hands/)).toBeInTheDocument();
});

it('Estimate has no amount or unit', async () => {
  const sheet = await openSheet();
  // The method is 'Estimated totals' since MM-219; the way in called Estimate is another control.
  await press(sheet, 'Estimated totals');
  expect(amountField(sheet)).not.toBeInTheDocument();
  await manual(sheet);
  await save(sheet);
  const p = (await only()).portion;
  expect(p?.method).toBe('quickAdd');
  expect(p?.quantity).toBeUndefined();
  expect(p?.unit).toBeUndefined();
  expect(await screen.findByText('Estimated totals')).toBeInTheDocument();
});

it('changing the method clears the amount', async () => {
  const sheet = await openSheet();
  await press(sheet, 'Weighed');
  await typeAmount(sheet, '150');
  await press(sheet, 'Cup / spoon');
  expect(amountField(sheet)).toHaveValue('');
  expect(within(sheet).getByRole('button', { name: 'Cups' })).toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'Grams' })).not.toBeInTheDocument();
});

it('a searched food is logged by weight and calculated', async () => {
  await logBananaByWeight();
  const entry = await only();
  expectClose(entry.kcal, 133.5, 1e-9);
  const p = entry.portion;
  expect(p?.method).toBe('weighed');
  expect(p?.basis).toBe('calculated');
  expect(p?.quantity).toBe(150);
  expect(p?.unit).toBe('gram');
  expect(p?.reference?.basis).toBe('per100g');
  expect(p?.reference?.nutrition.kcal).toBe(89);
  expect(await screen.findByText('150 g')).toBeInTheDocument();
});

it('editing a calculated entry restores it and recalculates', async () => {
  await logBananaByWeight();
  const sheet = await openEntry('Banana');
  expect(amountField(sheet)).toHaveValue('150');
  await typeAmount(sheet, '200');
  await save(sheet, 'Save changes');
  const entry = await only();
  expectClose(entry.kcal, 178, 1e-9);
  expect(entry.portion?.quantity, 'no double scaling').toBe(200);
});

it('editing a pack food keeps which food it came from (MM-169)', async () => {
  await logBananaByWeight();
  const origin = (await only()).portion?.origin;
  expect(origin).toBeDefined();
  const sheet = await openEntry('Banana');
  await typeAmount(sheet, '200');
  await save(sheet, 'Save changes');
  await expect.poll(async () => (await only()).portion?.quantity).toBe(200);
  expect((await only()).portion?.origin).toEqual(origin);
});

it('an entry logged by serving is restored as logged', async () => {
  let sheet = await openSheet();
  await manual(sheet, 'Bar', '160');
  await typeAmount(sheet, '1.5');
  await save(sheet);
  expect(await screen.findByText('1.5 servings')).toBeInTheDocument();
  sheet = await openEntry('Bar');
  expect(amountField(sheet)).toHaveValue('1.5');
  expect(within(sheet).getByText(/Logs 240 kcal/)).toBeInTheDocument();
  await press(sheet, 'Edit nutrition per serving');
  expect(within(sheet).getByRole('textbox', { name: /^Calories/ })).toBeInTheDocument();
});

it('MM-202 unchanged fractional calculated edit preserves nutrition', async () => {
  let sheet = await openSheet();
  await manual(sheet, 'Fractional bar', '300');
  await typeAmount(sheet, '1/3');
  await save(sheet);
  const before = await only();
  expectClose(before.kcal, 100, 1e-9);
  sheet = await openEntry('Fractional bar');
  await save(sheet, 'Save changes');
  const after = await only();
  expect(after.kcal).toBe(before.kcal);
  expect(after.portion?.quantity).toBe(before.portion?.quantity);
});

it('MM-202 unchanged legacy edit preserves recorded totals', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'lunch',
      name: 'Precise legacy',
      kcal: 100.123,
      proteinG: 1.234,
      carbsG: 20.123,
      fatG: 1.234,
      source: 'quickAdd',
    }),
  );
  await openFood();
  const sheet = await openEntry('Precise legacy');
  await save(sheet, 'Save changes');
  const after = await only();
  expect(after.kcal).toBe(100.123);
  expect(after.proteinG).toBe(1.234);
});

it('MM-203 per-serving alcohol scales with consumed calories', async () => {
  const sheet = await openSheet();
  await typeIn(sheet, 'Food name', 'Synthetic alcohol serving');
  await typeIn(sheet, 'Carbs g', '10');
  await press(sheet, 'Includes alcohol?');
  await typeIn(sheet, 'Alcohol g', '14');
  await typeAmount(sheet, '2');
  await save(sheet);
  const entry = await only();
  expect(entry.kcal).toBe(276);
  expect(entry.alcoholG).toBe(28);
});

it('MM-204 converting calculated entry to totals preserves alcohol', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'lunch',
      name: 'Calculated drink',
      kcal: 138,
      proteinG: 0,
      carbsG: 10,
      fatG: 0,
      alcoholG: 14,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: 1,
        unit: 'serving',
        reference: {
          basis: 'perServing',
          nutrition: new NutritionTotals({ kcal: 138, proteinG: 0, carbsG: 10, fatG: 0 }),
          servingUnit: 'serving',
        },
      },
    }),
  );
  await openFood();
  const sheet = await openEntry('Calculated drink');
  await press(sheet, 'Edit nutrition per serving');
  await save(sheet, 'Save changes');
  const entry = await only();
  expect(entry.kcal).toBe(138);
  expect(entry.alcoholG).toBe(14);
});

it('an entry from before amounts were recorded invents none', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'lunch',
      name: 'Old rice',
      kcal: 510,
      proteinG: 10,
      carbsG: 100,
      fatG: 2,
      source: 'weighed',
    }),
  );
  await openFood();
  // An amount that was never recorded draws no line on the row (MM-564); the editor says so.
  expect(await screen.findByText('Old rice')).toBeInTheDocument();
  expect(screen.queryByText(/amount not recorded/)).not.toBeInTheDocument();
  const sheet = await openEntry('Old rice');
  expect(within(sheet).getByText(/logged without an amount/)).toBeInTheDocument();
  expect(amountField(sheet)).not.toBeInTheDocument();
  await typeIn(sheet, /^Calories/, '520');
  await save(sheet, 'Save changes');
  await expect.poll(async () => (await only()).kcal).toBe(520);
  expect((await only()).portion).toBeUndefined();
});
