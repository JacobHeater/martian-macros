import { within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { normalizeBarcode } from '../../src/domain/food/normalizeBarcode';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { openAddFood, press, typeIn } from '../support/addFood';
import { newFoodBy, openLibrary } from '../support/openLibrary';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { scannerReading } from '../support/scannerReading';

/**
 * MM-44: read a Nutrition Facts panel into a saved food. The camera and
 * the text recogniser are fakes; the real plugins need a device. Carried
 * over from label_read_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

const panel = `
Nutrition Facts
Serving size 1 bar (40g)
Calories 180
Total Fat 6g
Total Carbohydrate 24g
Protein 8g
`;
// 8*4 + 24*4 + 6*9 = 182, so 180 agrees.
const misread = `
Serving size 1 bar (40g)
Calories 800
Total Fat 6g
Total Carbohydrate 24g
Protein 8g
`;

/** For `renderApp`'s `change`: a label reader that gives `text`, or undefined for a cancelled photograph. */
const readerGiving =
  (text: string | undefined) =>
  (services: AppServices): AppServices => ({ ...services, labelReader: { readLabel: () => Promise.resolve(text) } });

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** The form a food is typed into, from the Library's New food (MM-706), with the reader giving `text`. */
async function openForm(text: string | undefined): Promise<HTMLElement> {
  renderApp(repos, today, { change: readerGiving(text) });
  await openTab('Food');
  return newFoodBy(await openLibrary(), 'Type it in');
}

const field = (sheet: HTMLElement, label: string) => within(sheet).getByRole<HTMLInputElement>('textbox', { name: label });

it('a clear label fills the form to be checked', async () => {
  const sheet = await openForm(panel);
  await press(sheet, 'Read the nutrition label');
  expect(await within(sheet).findByText(/Check every number/)).toBeInTheDocument();
  expect(field(sheet, 'Calories')).toHaveValue('180');
  expect(field(sheet, 'Protein g')).toHaveValue('8');
  expect(field(sheet, 'Carbs g')).toHaveValue('24');
  expect(field(sheet, 'Fat g')).toHaveValue('6');
  expect(field(sheet, 'Weighs g')).toHaveValue('40');
  expect(field(sheet, 'One serving is')).toHaveValue('1 bar (40g)');
  expect(within(sheet).queryByText(/Double-check the label/)).not.toBeInTheDocument();
});

it('a panel read in columns fills the form with each number marked unsure until changed (MM-44)', async () => {
  const sheet = await openForm(
    'Serving size 1 bar (40g)\nCalories 180\nTotal Fat\nSodium\nTotal Carbohydrate\nProtein\n6g\n95mg\n24g\n8g',
  );
  await press(sheet, 'Read the nutrition label');
  expect(await within(sheet).findByText(/Numbers marked unsure were hard to read/)).toBeInTheDocument();
  expect(field(sheet, 'Fat g')).toHaveValue('6');
  expect(field(sheet, 'Carbs g')).toHaveValue('24');
  expect(field(sheet, 'Protein g')).toHaveValue('8');
  expect(field(sheet, 'Calories')).toHaveValue('180');
  // Fat, carbs, protein and sodium are marked; the calories, read beside their label, are not.
  expect(within(sheet).getAllByText('Unsure: check it')).toHaveLength(4);
  await typeIn(sheet, 'Protein g', '9');
  expect(within(sheet).getAllByText('Unsure: check it')).toHaveLength(3);
});

it('a misread calorie figure is flagged', async () => {
  const sheet = await openForm(misread);
  await press(sheet, 'Read the nutrition label');
  expect(await within(sheet).findByText(/Double-check the label/)).toBeInTheDocument();
  expect(field(sheet, 'Calories')).toHaveValue('800');
});

it('nothing readable says so and leaves the form alone', async () => {
  const sheet = await openForm('a photo of a cat');
  await press(sheet, 'Read the nutrition label');
  expect(await within(sheet).findByText(/No Nutrition Facts panel/)).toBeInTheDocument();
  expect(field(sheet, 'Calories')).toHaveValue('');
});

it('cancelling the camera changes nothing', async () => {
  const sheet = await openForm(undefined);
  await press(sheet, 'Read the nutrition label');
  await within(sheet).findByRole('button', { name: 'Read the nutrition label' });
  expect(field(sheet, 'Calories')).toHaveValue('');
  expect(within(sheet).queryByText(/Check every number/)).not.toBeInTheDocument();
});

it('with no camera it says so, and the numbers can still be typed', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await newFoodBy(await openLibrary(), 'Type it in');
  await press(sheet, 'Read the nutrition label');
  expect(await within(sheet).findByText(/The camera could not be used\./)).toBeInTheDocument();
  await typeIn(sheet, 'Calories', '120');
  expect(field(sheet, 'Calories')).toHaveValue('120');
});

it('an unknown barcode, once read and saved, is found again', async () => {
  const digits = '4006381333931';
  const catalog = await fixtureCatalog();
  renderApp(repos, today, {
    change: (services) => readerGiving(panel)(scannerReading(digits)(withCatalog(catalog)(services))),
  });
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Scan');
  await press(sheet, 'Scan with the camera');
  await press(sheet, 'Read the label');
  await press(sheet, 'Read the nutrition label');
  await within(sheet).findByText(/Check every number/);
  await typeIn(sheet, 'Name', 'Bar');
  await press(sheet, 'Save food');
  await expect.poll(async () => (await first(repos.customFoods.watchCustomFoods())).length).toBe(1);
  const saved = (await first(repos.customFoods.watchCustomFoods()))[0];
  expect(saved?.name).toBe('Bar');
  expect(saved?.barcode).toBe(normalizeBarcode(digits));
  expect(saved?.perServing.kcal).toBe(180);
  // MM-710: a food read from the label says so, and its row marks it as the label's.
  expect(saved?.evidence).toEqual({ kind: 'label' });
  expect(await within(sheet).findByText('Read from the label')).toBeInTheDocument();
});
