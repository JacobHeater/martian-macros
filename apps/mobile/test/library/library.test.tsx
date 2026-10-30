import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Exercise } from '../../src/domain/training/Exercise';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { editInLibrary, libraryForm, newFoodBy, openFold, openLibrary } from '../support/openLibrary';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-706: the Library, everything the person made, in folds; MM-707: the Saved step only picks. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const saved = () => first(repos.customFoods.watchCustomFoods());
const logged = (day: CalendarDate) => first(repos.food.watchFood(day));

const food = (init: {
  name: string;
  kind?: 'food' | 'recipe';
  servingDescription?: string;
  servingGrams?: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servings?: number;
  micros?: Micronutrients;
  fiberG?: number;
}) =>
  new CustomFood({
    id: 0,
    name: init.name,
    kind: init.kind ?? 'food',
    servingDescription: init.servingDescription ?? '1 serving',
    servingGrams: init.servingGrams,
    perServing: new NutritionTotals({ kcal: init.kcal, proteinG: init.proteinG, carbsG: init.carbsG, fatG: init.fatG }),
    servings: init.servings,
    fiberG: init.fiberG,
    ...(init.micros === undefined ? {} : { micros: init.micros }),
  });

/** The biscuit of MM-706's scenario: a saved food whose numbers allow a grade. */
const biscuit = () =>
  food({
    name: 'Buttermilk biscuit',
    servingDescription: '1 biscuit',
    servingGrams: 60,
    kcal: 220,
    proteinG: 4,
    carbsG: 28,
    fatG: 10,
    fiberG: 1,
    micros: new Micronutrients({ sodium: 540, sugars: 2, saturatedFat: 3 }),
  });

/** An entry logged from the saved food with `foodId`, `daysAgo` days ago (MM-167's origin). */
const loggedFrom = (name: string, foodId: number, daysAgo: number) =>
  new FoodEntry({
    id: 0,
    date: today.addDays(-daysAgo),
    meal: 'breakfast',
    name,
    kcal: 220,
    proteinG: 4,
    carbsG: 28,
    fatG: 10,
    source: 'householdMeasure',
    portion: { method: 'householdMeasure', basis: 'calculated', quantity: 1, unit: 'serving', origin: { packId: 'custom', foodId, source: 'user' } },
  });

async function logFrom(name: string, foodId: number, times: number, lastDaysAgo: number): Promise<void> {
  for (let i = 0; i < times; i++) await repos.food.addFood(loggedFrom(name, foodId, lastDaysAgo + i));
}

const landmine = () => new Exercise({ id: '', name: 'Landmine press', equipment: 'barbell', primary: 'shoulders', secondary: ['chest'], load: 'addedWeight' });

async function open(change?: (services: AppServices) => AppServices): Promise<HTMLElement> {
  renderApp(repos, today, change === undefined ? {} : { change });
  await openTab('Food');
  return openLibrary();
}

it('opens into closed folds that say what they hold, with New food above them', async () => {
  for (const name of ['Buttermilk biscuit', 'Protein bar', 'Granola']) {
    await repos.customFoods.saveCustomFood(food({ name, kcal: 200, proteinG: 5, carbsG: 30, fatG: 7 }));
  }
  await repos.customFoods.saveCustomFood(food({ name: 'Chili', kind: 'recipe', kcal: 400, proteinG: 35, carbsG: 30, fatG: 15, servings: 4 }));
  await repos.savedMeals.saveMeal('Usual breakfast', [foodOn(today, { name: 'Oats', kcal: 300 })], today);
  await repos.savedMeals.saveMeal('Quick lunch', [foodOn(today, { name: 'Wrap', kcal: 500 })], today);
  await repos.customExercises.saveCustomExercise(landmine());
  const library = await open();
  for (const title of ['Foods · 3', 'Recipes · 1', 'Meals · 2', 'Usual foods', 'Exercises · 1']) {
    expect(within(library).getByRole('button', { name: title })).toHaveAttribute('aria-expanded', 'false');
  }
  expect(within(library).getByRole('button', { name: 'New food' })).toBeInTheDocument();
  expect(within(library).queryByText(/^Buttermilk biscuit/)).not.toBeInTheDocument();
  // The buttons are in the order of the folds, New food first.
  const titles = ['New food', 'Foods · 3', 'Recipes · 1', 'Meals · 2', 'Usual foods', 'Exercises · 1'];
  const names = within(library)
    .getAllByRole('button')
    .map((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim())
    .filter((n) => titles.includes(n));
  expect(names).toEqual(titles);
});

it("a food's row says what it is, how often it is logged, and its grade", async () => {
  const id = await repos.customFoods.saveCustomFood(biscuit());
  await logFrom('Buttermilk biscuit', id, 12, 3);
  const library = await open();
  await openFold(library, 'Foods · 1');
  const row = (await within(library).findByText('Buttermilk biscuit')).closest('.mm-list-row') as HTMLElement;
  expect(within(row).getByText('1 biscuit (60 g) · 220 kcal · P 4 · C 28 · F 10')).toBeInTheDocument();
  expect(within(row).getByText('Last logged 3 days ago · 12 times')).toBeInTheDocument();
  expect(within(row).getByRole('button', { name: /^Grade .* for Buttermilk biscuit$/ })).toBeInTheDocument();
  expect(within(row).getByRole('button', { name: 'More actions for Buttermilk biscuit' })).toBeInTheDocument();
});

it('a recipe has no grade and says its servings; a food never logged says so', async () => {
  await repos.customFoods.saveCustomFood(food({ name: 'Chili', kind: 'recipe', servingDescription: '1 bowl', kcal: 400, proteinG: 35, carbsG: 30, fatG: 15, servings: 4 }));
  await repos.customFoods.saveCustomFood(food({ name: 'Protein bar', servingDescription: '1 bar', servingGrams: 30, kcal: 120, proteinG: 10, carbsG: 12, fatG: 4 }));
  const library = await open();
  await openFold(library, 'Recipes · 1');
  const chili = (await within(library).findByText('Chili')).closest('.mm-list-row') as HTMLElement;
  expect(within(chili).getByText('1 bowl · Makes 4 servings · 400 kcal · P 35 · C 30 · F 15')).toBeInTheDocument();
  expect(within(chili).queryByRole('button', { name: /^Grade/ })).not.toBeInTheDocument();
  await openFold(library, 'Foods · 1');
  const bar = (await within(library).findByText('Protein bar')).closest('.mm-list-row') as HTMLElement;
  expect(within(bar).getByText('Never logged')).toBeInTheDocument();
});

it('foods are sorted by how often they are logged, never logged last', async () => {
  const twelve = await repos.customFoods.saveCustomFood(food({ name: 'Oats', kcal: 300, proteinG: 10, carbsG: 50, fatG: 6 }));
  await repos.customFoods.saveCustomFood(food({ name: 'Almonds', kcal: 170, proteinG: 6, carbsG: 6, fatG: 15 }));
  const four = await repos.customFoods.saveCustomFood(food({ name: 'Yogurt', kcal: 120, proteinG: 15, carbsG: 8, fatG: 2 }));
  await logFrom('Oats', twelve, 12, 1);
  await logFrom('Yogurt', four, 4, 2);
  const library = await open();
  await openFold(library, 'Foods · 3');
  const rows = within(library).getAllByRole('button', { name: /^More actions for/ }).map((b) => b.getAttribute('aria-label'));
  expect(rows).toEqual(['More actions for Oats', 'More actions for Yogurt', 'More actions for Almonds']);
});

it('a food is edited from its menu, and editing never rewrites what was logged', async () => {
  const id = await repos.customFoods.saveCustomFood(food({ name: 'Protein bar', servingDescription: '1 bar', servingGrams: 30, kcal: 120, proteinG: 10, carbsG: 12, fatG: 4 }));
  await repos.food.addFood(loggedFrom('Protein bar', id, 1));
  const library = await open();
  await openFold(library, 'Foods · 1');
  await editInLibrary(library, 'Protein bar');
  const form = await libraryForm('Edit your food');
  await within(form).findByRole('heading', { name: 'Edit your food' });
  await typeIn(form, 'Calories', '150');
  await press(form, 'Save food');
  await expect.poll(async () => (await saved())[0]?.perServing.kcal).toBe(150);
  expect(await saved()).toHaveLength(1);
  expect((await logged(today.addDays(-1)))[0]?.kcal).toBe(120);
  // The row reads the change.
  expect(await within(library).findByText(/150 kcal/)).toBeInTheDocument();
});

it('a food is deleted from its menu after a question that says logged entries stay', async () => {
  await repos.customFoods.saveCustomFood(food({ name: 'Old bar', kcal: 200, proteinG: 5, carbsG: 30, fatG: 7 }));
  const library = await open();
  await openFold(library, 'Foods · 1');
  await press(library, 'More actions for Old bar');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  const question = await screen.findByRole('dialog', { name: 'Delete Old bar?' });
  expect(within(question).getByText(/Entries you already logged from it stay as they are/)).toBeInTheDocument();
  await userEvent.click(within(question).getByRole('button', { name: 'Delete' }));
  await expect.poll(async () => (await saved()).length).toBe(0);
  expect(await within(library).findByText('Nothing saved yet. New food makes one.')).toBeInTheDocument();
});

it('New food offers a label, typing, and a recipe', async () => {
  const library = await open();
  await press(library, 'New food');
  const chooser = await screen.findByRole('dialog', { name: 'New food' });
  for (const route of ['Scan a label', 'Type it in', 'New recipe']) {
    expect(within(chooser).getByRole('button', { name: new RegExp(`^${route}`) })).toBeInTheDocument();
  }
  expect(within(chooser).queryByRole('button', { name: /^With my AI/ }), 'MM-708 lands in its own PR').not.toBeInTheDocument();
});

it('a food typed in is saved, its fold opens on it, and the save is said', async () => {
  const library = await open();
  const form = await newFoodBy(library, 'Type it in');
  await within(form).findByRole('heading', { name: 'Save your own food' });
  await typeIn(form, 'Name', 'Protein bar');
  await typeIn(form, 'One serving is', '1 bar');
  await typeIn(form, 'Weighs g', '30');
  await typeIn(form, 'Protein g', '10');
  await typeIn(form, 'Carbs g', '12');
  await typeIn(form, 'Fat g', '4');
  await typeIn(form, 'Calories', '120');
  await press(form, 'Save food');
  await expect.poll(async () => (await saved()).map((f) => f.name)).toEqual(['Protein bar']);
  expect(await screen.findByText('Saved Protein bar')).toBeInTheDocument();
  await waitFor(() => expect(within(library).getByRole('button', { name: 'Foods · 1' })).toHaveAttribute('aria-expanded', 'true'));
  expect(within(library).getByText('1 bar (30 g) · 120 kcal · P 10 · C 12 · F 4')).toBeInTheDocument();
});

it('Scan a label opens the form and reads the label at once', async () => {
  const panel = 'Nutrition Facts\nServing size 1 bar (40g)\nCalories 180\nTotal Fat 6g\nTotal Carbohydrate 24g\nProtein 8g';
  const library = await open((services) => ({ ...services, labelReader: { readLabel: () => Promise.resolve(panel) } }));
  const form = await newFoodBy(library, 'Scan a label');
  expect(await within(form).findByText(/Check every number/)).toBeInTheDocument();
  expect(within(form).getByRole<HTMLInputElement>('textbox', { name: 'Calories' })).toHaveValue('180');
  expect(within(form).getByRole<HTMLInputElement>('textbox', { name: 'Weighs g' })).toHaveValue('40');
});

it('a recipe made from New food is saved and listed under Recipes', async () => {
  const library = await open();
  const form = await newFoodBy(library, 'New recipe');
  await typeIn(form, 'Name', 'Chili');
  await typeIn(form, 'Makes servings', '4');
  await press(form, 'Enter numbers instead');
  await typeIn(form, 'Ingredient', 'Beef');
  await typeIn(form, 'kcal', '1000');
  await typeIn(form, 'Protein g', '100');
  await press(form, 'Add ingredient');
  await press(form, 'Save recipe');
  await expect.poll(async () => (await saved()).map((f) => [f.name, f.kind])).toEqual([['Chili', 'recipe']]);
  expect(await screen.findByText('Saved Chili')).toBeInTheDocument();
  await waitFor(() => expect(within(library).getByRole('button', { name: 'Recipes · 1' })).toHaveAttribute('aria-expanded', 'true'));
  expect(within(library).getByText(/Makes 4 servings/)).toBeInTheDocument();
});

it('a usual food from the log is saved as a food, filled from its latest entry', async () => {
  await repos.food.addFood(foodOn(today.addDays(-2), { name: 'Greek yogurt', meal: 'breakfast', kcal: 120, proteinG: 15, carbsG: 8, fatG: 2 }));
  await repos.food.addFood(foodOn(today.addDays(-5), { name: 'Greek yogurt', meal: 'breakfast', kcal: 110, proteinG: 14, carbsG: 8, fatG: 2 }));
  await repos.food.addFood(foodOn(today.addDays(-3), { name: 'Toast', meal: 'breakfast', kcal: 80, proteinG: 3, carbsG: 15, fatG: 1 }));
  const library = await open();
  await openFold(library, 'Usual foods');
  const row = (await within(library).findByText('Greek yogurt')).closest('.mm-list-row') as HTMLElement;
  expect(within(row).getByText('Logged 2 times in the last 4 weeks')).toBeInTheDocument();
  expect(within(library).queryByText('Toast'), 'once is not usual').not.toBeInTheDocument();
  await press(row, 'Save as a food');
  const form = await libraryForm('Save as a food');
  await within(form).findByRole('heading', { name: 'Save as a food' });
  expect(within(form).getByRole<HTMLInputElement>('textbox', { name: 'Name' })).toHaveValue('Greek yogurt');
  expect(within(form).getByRole<HTMLInputElement>('textbox', { name: 'Calories' })).toHaveValue('120');
  await typeIn(form, 'Weighs g', '170');
  await press(form, 'Save food');
  await expect.poll(async () => (await saved()).map((f) => f.name)).toEqual(['Greek yogurt']);
  await waitFor(() => expect(within(library).getByRole('button', { name: 'Foods · 1' })).toHaveAttribute('aria-expanded', 'true'));
  // Saved, it is no longer listed among the usual foods.
  await waitFor(() => expect(within(library).queryByText('Logged 2 times in the last 4 weeks')).not.toBeInTheDocument());
});

it('a saved meal is listed with its foods and deleted from its menu', async () => {
  await repos.savedMeals.saveMeal('Usual breakfast', [foodOn(today, { name: 'Oats', kcal: 300 }), foodOn(today, { name: 'Berries', kcal: 40 })], today);
  const library = await open();
  await openFold(library, 'Meals · 1');
  expect(await within(library).findByText('2 foods · 340 kcal · Oats, Berries')).toBeInTheDocument();
  await press(library, 'More actions for Usual breakfast');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  const question = await screen.findByRole('dialog', { name: 'Delete Usual breakfast?' });
  await userEvent.click(within(question).getByRole('button', { name: 'Delete' }));
  await expect.poll(async () => (await first(repos.savedMeals.watchSavedMeals())).length).toBe(0);
});

it('an exercise of the person’s own is listed, edited and deleted', async () => {
  await repos.customExercises.saveCustomExercise(landmine());
  const library = await open();
  await openFold(library, 'Exercises · 1');
  const row = (await within(library).findByText('Landmine press')).closest('.mm-list-row') as HTMLElement;
  expect(within(row).getByText('Barbell · Shoulders, Chest')).toBeInTheDocument();
  expect(within(row).getByText('Never trained')).toBeInTheDocument();
  await editInLibrary(library, 'Landmine press');
  await within(topLayer()).findByRole('heading', { name: 'Edit your exercise' });
  await typeIn(topLayer(), 'Name', 'Landmine press, kneeling');
  await press(topLayer(), 'Save exercise');
  await expect.poll(async () => (await first(repos.customExercises.watchCustomExercises())).map((e) => e.name)).toEqual(['Landmine press, kneeling']);
  expect(await screen.findByText('Saved Landmine press, kneeling')).toBeInTheDocument();
  await press(library, 'More actions for Landmine press, kneeling');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  const question = await screen.findByRole('dialog', { name: 'Delete Landmine press, kneeling?' });
  expect(within(question).getByText(/Sets you already logged with it stay/)).toBeInTheDocument();
  await userEvent.click(within(question).getByRole('button', { name: 'Delete' }));
  await expect.poll(async () => (await first(repos.customExercises.watchCustomExercises())).length).toBe(0);
});

it('empty, each fold says in one line what fills it', async () => {
  const library = await open();
  for (const title of ['Foods', 'Recipes', 'Meals', 'Usual foods', 'Exercises']) await openFold(library, title);
  for (const line of [
    'Nothing saved yet. New food makes one.',
    'No recipes yet. New food makes one.',
    'No meals yet. Save one from a day’s foods on Food.',
    'Log a few days and your usual foods show here.',
    'Add an exercise from a workout, and it shows here.',
  ]) {
    expect(await within(library).findByText(line)).toBeInTheDocument();
  }
});
