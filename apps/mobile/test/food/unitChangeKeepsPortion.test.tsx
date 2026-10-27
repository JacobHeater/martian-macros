import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
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
 * MM-628: changing the unit kept nothing: the amount step reset it to 100 g
 * or 4 oz, the editor emptied it, and the typed form kept the number in the
 * new unit. Now a unit with an exact measure keeps the same portion.
 */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;
let catalog: FoodCatalog;

beforeAll(async () => {
  catalog = await fixtureCatalog();
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const logged = () => first(repos.food.watchFood(today));
const amountField = (sheet: HTMLElement) =>
  within(sheet).getByRole<HTMLInputElement>('textbox', { name: /^(Amount|How many|Servings eaten)/ });

async function pick(query: string, name: RegExp): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', query);
  const results = await within(sheet).findAllByRole('button', { name });
  await userEvent.click(results.find((row) => !/Your recent food|From your log/.test(row.textContent ?? '')) ?? (results[0] as HTMLElement));
  await within(sheet).findByRole('button', { name: 'Log it' });
  return sheet;
}

it('MM-628: 180 g becomes 6.35 oz, the same portion, and back again', async () => {
  const sheet = await pick('white rice cooked', /^White rice, cooked/);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '180');
  const totals = within(sheet).getByTestId('amount-macros').textContent;
  await press(sheet, 'Ounces');
  expect(amountField(sheet)).toHaveValue('6.35');
  expect(within(sheet).getByText('Same amount as 180 g.')).toBeInTheDocument();
  expect(within(sheet).getByTestId('amount-macros').textContent, 'the same totals').toBe(totals);
  await press(sheet, 'Grams');
  expect(amountField(sheet)).toHaveValue('180');
});

it('MM-628: a converted amount left as shown logs the exact portion', async () => {
  const sheet = await pick('white rice cooked', /^White rice, cooked/);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '180');
  await press(sheet, 'Ounces');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  const [rice] = await logged();
  expectClose(rice?.kcal ?? 0, 234, 1e-9);
  expect(rice?.portion?.unit).toBe('ounce');
});

it('MM-628: servings become grams through the serving’s weight', async () => {
  const sheet = await pick('white rice cooked', /^White rice, cooked/);
  await typeIn(sheet, /^How many servings/, '1.5');
  await press(sheet, 'Grams');
  expect(amountField(sheet)).toHaveValue('237');
});

it('MM-628: the usual figure, never typed, is not a portion: grams start at 100', async () => {
  const sheet = await pick('white rice cooked', /^White rice, cooked/);
  await press(sheet, 'Grams');
  expect(amountField(sheet)).toHaveValue('100');
});

it('MM-628: never into a hand portion: the amount is asked again', async () => {
  const sheet = await pick('banana', /^Banana/);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '180');
  await press(sheet, 'Palms');
  expect(amountField(sheet)).toHaveValue('');
  expect(within(sheet).getByText('Enter how much again in this unit.')).toBeInTheDocument();
});

it('MM-628: editing a calculated entry converts its amount, and an unchanged save keeps its totals', async () => {
  const sheet = await pick('white rice cooked', /^White rice, cooked/);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '180');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
  await userEvent.click(await screen.findByRole('button', { name: /^Edit White rice, cooked/ }));
  const edit = await foodSheet('Edit food');
  await press(edit, 'Ounces');
  expect(amountField(edit)).toHaveValue('6.35');
  await press(edit, 'Save changes');
  await expect.poll(async () => (await logged())[0]?.portion?.unit).toBe('ounce');
  expectClose((await logged())[0]?.kcal ?? 0, 234, 1e-9);
});

it('MM-628: typed totals convert cups to tablespoons, and keep the totals typed', async () => {
  renderApp(repos, today);
  const sheet = await openAddFood();
  await enterManually(sheet);
  await press(sheet, 'Cup / spoon');
  await press(sheet, 'Cups');
  await typeIn(sheet, 'Food name', 'Soup');
  await typeIn(sheet, /^Calories/, '300');
  await typeIn(sheet, /^Amount/, '2');
  await press(sheet, 'Tablespoons');
  expect(amountField(sheet)).toHaveValue('32');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  const [soup] = await logged();
  expect(soup?.kcal).toBe(300);
  expect(soup?.portion?.quantity).toBe(32);
  expect(soup?.portion?.unit).toBe('tablespoon');
});
