import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { CatalogFood } from '../../src/foodCatalog/CatalogFood';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { foodSheet, openAddFood } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-733 (the owner, 2026-11-05): the micros of a food on its sheet, in
 * entry, edit and view mode, under a Micros fold that starts closed: the
 * Food screen's rows, each against the daily reference, what the food
 * leaves unstated named once.
 */
const today = CalendarDate.of(2026, 11, 5);
let repos: InMemoryRepositories;

/** Raw kale in the test pack, per 100 g, stating three micronutrients and sodium. */
const kale: PackEntry = {
  food: new CatalogFood({
    id: 9001,
    packId: FixturePack.packId,
    name: 'Kale, raw',
    kcal: 35,
    proteinG: 2.9,
    carbsG: 4.4,
    fatG: 1.5,
    sodiumMg: 53,
    micros: { potassium: 348, calcium: 254, vitaminC: 93 },
    preparation: 'raw',
    source: 'fixture',
    sourceId: 'fixture-9001',
    tier: 'reference',
    tierReason: 'Test data, not a nutrition source.',
  }),
  servings: [],
};

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** Opens the fold called Micros in `sheet`. */
const openMicros = async (sheet: HTMLElement) => userEvent.click(within(sheet).getByRole('button', { name: 'Micros' }));

it('entry: the amount step folds the food’s micros at the amount chosen, against the daily reference', async () => {
  const catalog = await fixtureCatalog(FixturePack.header, [...FixturePack.entries, kale]);
  renderApp(repos, today, { change: withCatalog(catalog) });
  const sheet = await openAddFood();
  await userEvent.type(within(sheet).getByRole('textbox', { name: 'Search foods' }), 'kale');
  // A result takes a read of the food pack to arrive.
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Kale, raw/ }, { timeout: 10000 }));
  await within(sheet).findByText(/^Logs 35 kcal/);
  // The fold starts closed; nothing of it is drawn until it is opened.
  expect(within(sheet).queryByText('Minerals')).not.toBeInTheDocument();
  await openMicros(sheet);
  // A man of 36: potassium's reference is 3,400 mg; 100 g of kale gives 348.
  expect(await within(sheet).findByText('Potassium, 348 milligrams, reference 3,400 milligrams')).toBeInTheDocument();
  expect(within(sheet).getByText('Vitamin C, 93 milligrams, reference 90 milligrams')).toBeInTheDocument();
  expect(within(sheet).getByText('Not stated by this food: Iron, Magnesium, Zinc.')).toBeInTheDocument();
  // One food lists no foods under a row.
  expect(within(sheet).queryByRole('button', { name: /^Potassium/ })).not.toBeInTheDocument();
});

it('edit: the sheet folds the entry’s micros as they will be saved', async () => {
  await repos.food.addFood(
    foodOn(today, { name: 'Chicken and rice', meal: 'lunch', kcal: 510, proteinG: 51, carbsG: 40, fatG: 10, sodiumMg: 400, micros: new Micronutrients({ potassium: 700, sugars: 3 }) }),
  );
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Edit Chicken and rice' }));
  const sheet = await foodSheet('Edit food');
  expect(within(sheet).queryByText('Minerals')).not.toBeInTheDocument();
  await openMicros(sheet);
  expect(await within(sheet).findByText('Potassium, 700 milligrams, reference 3,400 milligrams')).toBeInTheDocument();
  expect(within(sheet).getByText('Sodium, 400 milligrams')).toBeInTheDocument();
  expect(within(sheet).getByText('Total sugars, 3 grams')).toBeInTheDocument();
  expect(within(sheet).getByText('Not stated by this food: Calcium, Iron, Magnesium, Zinc.')).toBeInTheDocument();
});

it('edit: a food stating none of them says so in one line', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Mystery bar', meal: 'lunch', kcal: 200, proteinG: 10, carbsG: 20, fatG: 8 }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Edit Mystery bar' }));
  const sheet = await foodSheet('Edit food');
  await openMicros(sheet);
  expect(await within(sheet).findByText('No micronutrients are stated for this food.')).toBeInTheDocument();
  expect(within(sheet).queryByText('Minerals')).not.toBeInTheDocument();
});

it('view: View meal folds the meal’s micros over its foods, with how many state each', async () => {
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  const loggedMeal = { key: 'k1', name: 'Chicken and rice' };
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date: today, meal: 'dinner', eatenAt: 19 * 60, loggedMeal }));
  }
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'View Chicken and rice' }));
  const sheet = await screen.findByRole('dialog', { name: 'View meal' });
  expect(within(sheet).queryByText('Minerals')).not.toBeInTheDocument();
  await openMicros(sheet);
  expect(await within(sheet).findByText(/^Potassium, 384 milligrams, from 1 of 3 foods · reference 3,400 milligrams$/)).toBeInTheDocument();
  expect(within(sheet).getByText(/^Not stated by any food: /)).toBeInTheDocument();
  // A meal's rows open to the foods that add the most, as the day's do (MM-561).
  expect(within(sheet).getByRole('button', { name: /^Potassium, 384 milligrams/ })).toBeInTheDocument();
});
