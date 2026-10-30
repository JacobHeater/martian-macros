import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-45: foods and recipes the user saves once and logs in any amount. Carried over from custom_foods_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function open(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  return openAddFood();
}

const logged = () => first(repos.food.watchFood(today));

/** Opens a saved food's editor from its menu in Saved (MM-635). */
async function editSaved(sheet: HTMLElement, name: string): Promise<void> {
  await press(sheet, `More actions for ${name}`);
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
}
const saved = () => first(repos.customFoods.watchCustomFoods());

async function createBar(sheet: HTMLElement): Promise<void> {
  await press(sheet, 'Saved');
  await press(sheet, 'New food');
  await typeIn(sheet, 'Name', 'Protein bar');
  await typeIn(sheet, 'One serving is', '1 bar');
  await typeIn(sheet, 'Weighs g', '30');
  await typeIn(sheet, 'Protein g', '10');
  await typeIn(sheet, 'Carbs g', '12');
  await typeIn(sheet, 'Fat g', '4');
  await typeIn(sheet, 'Calories', '120');
  await press(sheet, 'Save food');
  await within(sheet).findByRole('heading', { name: 'My foods' });
}

/** Leaves "My foods", searches for `query` and picks the saved food called `name`. */
async function pickSaved(sheet: HTMLElement, query: string, name: string): Promise<void> {
  await typeIn(sheet, 'Search foods', query);
  await userEvent.click(await within(sheet).findByRole('button', { name: new RegExp(`^${name}`) }));
  await within(sheet).findByRole('button', { name: 'Log it' });
}

const food = (init: {
  name: string;
  kind?: 'food' | 'recipe';
  servingDescription: string;
  servingGrams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  barcode?: string;
  servings?: number;
  cookedWeightGrams?: number;
}) =>
  new CustomFood({
    id: 0,
    name: init.name,
    kind: init.kind ?? 'food',
    servingDescription: init.servingDescription,
    servingGrams: init.servingGrams,
    perServing: new NutritionTotals({ kcal: init.kcal, proteinG: init.proteinG, carbsG: init.carbsG, fatG: init.fatG }),
    barcode: init.barcode,
    servings: init.servings,
    cookedWeightGrams: init.cookedWeightGrams,
  });

it('a saved food is logged in any amount', async () => {
  const sheet = await open();
  await createBar(sheet);
  expect(within(sheet).getByRole('button', { name: /^Protein bar(?!:)/ })).toBeInTheDocument();
  await press(sheet, 'Back');
  await typeIn(sheet, 'Search foods', 'protein');
  expect(await within(sheet).findByText('Your food · 1 bar · 120 kcal')).toBeInTheDocument();
  await press(sheet, /^Protein bar(?!:)/);
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '45');
  expect(within(sheet).getByText(/180 kcal/)).toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  const entry = (await logged())[0];
  expect(entry?.name).toBe('Protein bar');
  expectClose(entry?.kcal ?? 0, 180, 1e-9);
  expectClose(entry?.proteinG ?? 0, 15, 1e-9);
  expect(entry?.portion?.quantity).toBe(45);
  expect(entry?.portion?.unit).toBe('gram');
  expect(entry?.portion?.reference?.basis).toBe('perServing');
});

it('editing a saved food does not rewrite what was logged', async () => {
  let sheet = await open();
  await createBar(sheet);
  await press(sheet, 'Back');
  await pickSaved(sheet, 'protein', 'Protein bar');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  expect((await logged())[0]?.kcal).toBe(120);

  // Change the food's calories afterwards.
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
  sheet = await openAddFood();
  await press(sheet, 'Saved');
  // MM-635: in Add food a saved food is edited from its menu; pressing it logs it.
  await editSaved(sheet, 'Protein bar');
  await typeIn(sheet, 'Calories', '150');
  await press(sheet, 'Save food');
  await expect.poll(async () => (await saved())[0]?.perServing.kcal).toBe(150);
  expect(await saved()).toHaveLength(1);
  expect((await logged())[0]?.kcal).toBe(120);
});

it('calories that disagree with the macros warn', async () => {
  const sheet = await open();
  await press(sheet, 'Saved');
  await press(sheet, 'New food');
  await typeIn(sheet, 'Protein g', '10');
  await typeIn(sheet, 'Carbs g', '10');
  await typeIn(sheet, 'Fat g', '5');
  await typeIn(sheet, 'Calories', '400');
  expect(within(sheet).getByText(/Macros add up to 125 kcal/)).toBeInTheDocument();
});

it('a recipe divides its ingredients into servings', async () => {
  const sheet = await open();
  await press(sheet, 'Saved');
  await press(sheet, 'New recipe');
  await typeIn(sheet, 'Name', 'Chili');
  await typeIn(sheet, 'Makes servings', '4');
  await press(sheet, 'Enter numbers instead');
  for (const [name, kcal, protein] of [
    ['Beef', '1000', '100'],
    ['Beans', '600', '40'],
  ] as const) {
    await typeIn(sheet, 'Ingredient', name);
    await typeIn(sheet, 'kcal', kcal);
    await typeIn(sheet, 'Protein g', protein);
    await press(sheet, 'Add ingredient');
  }
  expect(within(sheet).getByText(/One serving: 400 kcal/)).toBeInTheDocument();
  expect(within(sheet).getByText(/35 g protein/)).toBeInTheDocument();
  await press(sheet, 'Save recipe');
  await expect.poll(async () => (await saved()).length).toBe(1);
  const chili = (await saved())[0];
  expect(chili?.kind).toBe('recipe');
  expect(chili?.servings).toBe(4);
  expect(chili?.perServing.kcal).toBe(400);
  expect(chili?.servingGrams, 'no cooked weight given').toBeUndefined();
  expect(chili?.ingredients).toHaveLength(2);

  await press(sheet, 'Back');
  await pickSaved(sheet, 'chili', 'Chili');
  expect(within(sheet).queryByRole('button', { name: 'Grams' }), 'servings only').not.toBeInTheDocument();
  await typeIn(sheet, 'How many servings', '1.5');
  expect(within(sheet).getByText(/600 kcal/)).toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).length).toBe(1);
  const entry = (await logged())[0];
  expect(entry?.kcal).toBe(600);
  expect(entry?.portion?.quantity).toBe(1.5);
  expect(entry?.portion?.unit).toBe('serving');
});

it('a cooked weight lets a recipe be logged by weight', async () => {
  await repos.customFoods.saveCustomFood(
    food({
      name: 'Stew',
      kind: 'recipe',
      servingDescription: '1 serving',
      servingGrams: 300,
      kcal: 450,
      proteinG: 30,
      carbsG: 40,
      fatG: 15,
      servings: 4,
      cookedWeightGrams: 1200,
    }),
  );
  const sheet = await open();
  await pickSaved(sheet, 'stew', 'Stew');
  await press(sheet, 'Grams');
  await typeIn(sheet, /^Amount/, '150');
  expect(within(sheet).getByText(/225 kcal/)).toBeInTheDocument();
});

it('scanning a barcode that is a saved food finds it', async () => {
  await repos.customFoods.saveCustomFood(
    food({
      name: 'Granola from the shop',
      servingDescription: '1 cup',
      servingGrams: 60,
      kcal: 250,
      proteinG: 6,
      carbsG: 40,
      fatG: 8,
      barcode: '00036000291452',
    }),
  );
  const sheet = await open();
  await press(sheet, 'Scan');
  await typeIn(sheet, 'Or type the digits', '036000291452');
  await press(sheet, 'Look up');
  expect(await within(sheet).findByRole('heading', { name: 'Granola from the shop' })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Log it' })).toBeInTheDocument();
});

it('deleting a saved food asks first and keeps the sheet open', async () => {
  await repos.customFoods.saveCustomFood(
    food({ name: 'Old bar', servingDescription: '1 bar', servingGrams: 40, kcal: 200, proteinG: 5, carbsG: 30, fatG: 7 }),
  );
  const sheet = await open();
  await press(sheet, 'Saved');
  await press(sheet, 'More actions for Old bar');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  const question = await screen.findByRole('dialog', { name: 'Delete Old bar?' });
  await userEvent.click(within(question).getByRole('button', { name: 'Delete' }));
  expect(await within(sheet).findByText('Nothing saved yet.')).toBeInTheDocument();
});

/** Opens a new recipe called `name`, with the fixture pack installed. */
async function newRecipe(name: string): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(await fixtureCatalog()) });
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Saved');
  await press(sheet, 'New recipe');
  await typeIn(sheet, 'Name', name);
  return sheet;
}

it('an ingredient the pack has raw and cooked asks which was weighed', async () => {
  const sheet = await newRecipe('Rice bowl');
  await typeIn(sheet, 'Search ingredients', 'white rice');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^White rice, cooked/ }));
  expect(await within(sheet).findByText('Choose the state it was in when you weighed it.')).toBeInTheDocument();
  await typeIn(sheet, 'Weight g', '200');
  expect(within(sheet).getByText('200 g cooked is about 260 kcal. 200 g raw is about 730 kcal.')).toBeInTheDocument();
  await press(sheet, 'Raw');
  expect(within(sheet).getByText('200 g raw is about 730 kcal. 200 g cooked is about 260 kcal.')).toBeInTheDocument();
  await press(sheet, 'Add ingredient');
  await typeIn(sheet, 'Makes servings', '2');
  expect(within(sheet).getByText(/One serving: 365 kcal/)).toBeInTheDocument();
  await press(sheet, 'Save recipe');
  await expect.poll(async () => (await saved()).length).toBe(1);
  const line = (await saved())[0]?.ingredients[0];
  expect(line?.name).toBe('White rice, raw');
  expect(line?.grams).toBe(200);
  expectClose(line?.totals.kcal ?? 0, 730, 1e-9);
});

/** MM-456: a saved rice bowl of one line, 200 g "White rice, raw" from `packId`, at `kcal` for the line. */
async function saveRiceBowl(packId: string, kcal = 730): Promise<void> {
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Rice bowl',
      kind: 'recipe',
      servingDescription: '1 serving',
      perServing: new NutritionTotals({ kcal: kcal / 2, proteinG: 7, carbsG: 80, fatG: 0.7 }),
      servings: 2,
      ingredients: [
        {
          name: 'White rice, raw',
          grams: 200,
          totals: new NutritionTotals({ kcal, proteinG: 14, carbsG: 160, fatG: 1.4 }),
          source: { packId, foodId: 3 },
        },
        { name: 'Butter', grams: 10, totals: new NutritionTotals({ kcal: 72, proteinG: 0, carbsG: 0, fatG: 8 }) },
      ],
    }),
  );
}

/** Opens the saved recipe called `name` to change it, with the fixture pack installed. */
async function editRecipe(name: string): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(await fixtureCatalog()) });
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Saved');
  await editSaved(sheet, name);
  await within(sheet).findByRole('heading', { name: 'Edit your recipe' });
  return sheet;
}

it('an ingredient found in the pack keeps the food it came from; one typed keeps none (MM-456)', async () => {
  const sheet = await newRecipe('Rice bowl');
  await typeIn(sheet, 'Search ingredients', 'white rice');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^White rice, cooked/ }));
  await typeIn(sheet, 'Weight g', '200');
  await press(sheet, 'Raw');
  await press(sheet, 'Add ingredient');
  await press(sheet, 'Enter numbers instead');
  await typeIn(sheet, 'Ingredient', 'Butter');
  await typeIn(sheet, 'kcal', '72');
  await press(sheet, 'Add ingredient');
  await press(sheet, 'Save recipe');
  await expect.poll(async () => (await saved()).length).toBe(1);
  const [rice, butter] = (await saved())[0]?.ingredients ?? [];
  expect(rice?.source).toEqual({ packId: 'fixture', foodId: 3 });
  expect(butter?.source, 'a line typed as totals records no source').toBeUndefined();
});

it("a found line's weight is changed in place, from the food as installed (MM-456)", async () => {
  await saveRiceBowl('fixture');
  const sheet = await editRecipe('Rice bowl');
  await press(sheet, 'More actions for White rice, raw');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change weight' }));
  // The food is looked up in the pack first; the field takes focus as it opens.
  const field = await within(sheet).findByRole('textbox', { name: 'Weight g for White rice, raw' });
  await waitFor(() => expect(field).toHaveFocus());
  await typeIn(sheet, 'Weight g for White rice, raw', '100');
  expect(within(sheet).getByText('100 g is about 365 kcal.')).toBeInTheDocument();
  await press(sheet, 'Save weight');
  expect(within(sheet).getByText('100 g · 365 kcal')).toBeInTheDocument();
  // Focus goes back to that line's menu button.
  await waitFor(() => expect(within(sheet).getByRole('button', { name: 'More actions for White rice, raw' })).toHaveFocus());
  await press(sheet, 'Save recipe');
  await expect.poll(async () => (await saved())[0]?.ingredients[0]?.grams).toBe(100);
  const [rice] = (await saved())[0]?.ingredients ?? [];
  expectClose(rice?.totals.kcal ?? 0, 365, 1e-9);
  expect(rice?.source, 'it still knows its food').toEqual({ packId: 'fixture', foodId: 3 });
});

it('a line typed as totals cannot be weighed again (MM-456)', async () => {
  await saveRiceBowl('fixture');
  const sheet = await editRecipe('Rice bowl');
  await press(sheet, 'More actions for Butter');
  expect(await screen.findByRole('menuitem', { name: 'Remove' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Change weight' })).not.toBeInTheDocument();
});

it("a pack's change does not rewrite a saved recipe until its line is edited (MM-456)", async () => {
  // Saved when the pack said 350 kcal per 100 g; it now says 365.
  await saveRiceBowl('fixture', 700);
  const sheet = await editRecipe('Rice bowl');
  expect(within(sheet).getByText('200 g · 700 kcal')).toBeInTheDocument();
  await press(sheet, 'Save recipe');
  await expect.poll(async () => (await saved())[0]?.ingredients[0]?.totals.kcal).toBe(700);
});

it('a line whose food is no longer installed cannot be weighed again, and keeps its totals (MM-456)', async () => {
  await saveRiceBowl('a-pack-since-removed');
  const sheet = await editRecipe('Rice bowl');
  await press(sheet, 'More actions for White rice, raw');
  expect(await screen.findByRole('menuitem', { name: 'Remove' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Change weight' })).not.toBeInTheDocument();
  expect(within(sheet).getByText('200 g · 730 kcal · food not installed')).toBeInTheDocument();
});

it('cancelling a weight change returns focus to the line (MM-456)', async () => {
  await saveRiceBowl('fixture');
  const sheet = await editRecipe('Rice bowl');
  await press(sheet, 'More actions for White rice, raw');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change weight' }));
  await within(sheet).findByRole('textbox', { name: 'Weight g for White rice, raw' });
  // The line's own Cancel, drawn under it, before the form's.
  await userEvent.click(within(sheet).getAllByRole('button', { name: 'Cancel' })[0] as HTMLElement);
  await waitFor(() => expect(within(sheet).getByRole('button', { name: 'More actions for White rice, raw' })).toHaveFocus());
  expect(within(sheet).getByText('200 g · 730 kcal')).toBeInTheDocument();
});

it('after an ingredient is added, focus is back in the search and the addition is said (MM-456)', async () => {
  const sheet = await newRecipe('Rice bowl');
  await typeIn(sheet, 'Search ingredients', 'white rice');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^White rice, cooked/ }));
  await typeIn(sheet, 'Weight g', '200');
  await press(sheet, 'Add ingredient');
  await waitFor(() => expect(within(sheet).getByRole('textbox', { name: 'Search ingredients' })).toHaveFocus());
  expect(within(sheet).getByText('Added White rice, cooked').closest('[role="status"]')).not.toBeNull();
});

it("a recipe's ingredients can be put in another order", async () => {
  const sheet = await newRecipe('Chili');
  await press(sheet, 'Enter numbers instead');
  for (const [name, kcal] of [
    ['Beef', '1000'],
    ['Beans', '600'],
    ['Onion', '80'],
  ] as const) {
    await typeIn(sheet, 'Ingredient', name);
    await typeIn(sheet, 'kcal', kcal);
    await press(sheet, 'Add ingredient');
  }
  await press(sheet, 'More actions for Beef');
  const down = await screen.findByRole('menuitem', { name: 'Move down' });
  expect(screen.queryByRole('menuitem', { name: 'Move up' }), 'the first cannot go higher').not.toBeInTheDocument();
  await userEvent.click(down);
  await press(sheet, 'More actions for Onion');
  const up = await screen.findByRole('menuitem', { name: 'Move up' });
  expect(screen.queryByRole('menuitem', { name: 'Move down' }), 'the last cannot go lower').not.toBeInTheDocument();
  await userEvent.click(up);
  await press(sheet, 'More actions for Beans');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
  await press(sheet, 'Save recipe');
  await expect.poll(async () => (await saved()).length).toBe(1);
  expect((await saved())[0]?.ingredients.map((i) => i.name)).toEqual(['Onion', 'Beef']);
});

// MM-635 (the owner, 2026-10-26): in Add food, a saved food is logged by pressing it.
it('MM-635: pressing a saved food in Add food opens its amount step and logs it', async () => {
  await repos.customFoods.saveCustomFood(
    food({ name: 'Protein bar', servingDescription: '1 bar', servingGrams: 30, kcal: 120, proteinG: 10, carbsG: 12, fatG: 4 }),
  );
  const sheet = await open();
  await press(sheet, 'Saved');
  expect(await within(sheet).findByText(/^Press one to log it/)).toBeInTheDocument();
  await press(sheet, /^Protein bar/);
  await press(sheet, 'Log it');
  await expect.poll(async () => (await logged()).map((f) => [f.name, f.kcal])).toEqual([['Protein bar', 120]]);
});


// MM-710: a saved food carries its group, where its numbers came from, and what went into it.
it('MM-710: the typed form chooses a food group, a typed food is the person’s own, and the Saved step says so', async () => {
  const sheet = await open();
  await press(sheet, 'Saved');
  await press(sheet, 'New food');
  await typeIn(sheet, 'Name', 'Protein bar');
  await typeIn(sheet, 'One serving is', '1 bar');
  await typeIn(sheet, 'Weighs g', '30');
  await typeIn(sheet, 'Protein g', '10');
  await typeIn(sheet, 'Carbs g', '12');
  await typeIn(sheet, 'Fat g', '4');
  await typeIn(sheet, 'Calories', '120');
  await userEvent.click(within(sheet).getByRole('button', { name: /^Food group \(optional\)/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'Snacks and sweets' }));
  await press(sheet, 'Save food');
  await within(sheet).findByRole('heading', { name: 'My foods' });
  const [bar] = await saved();
  expect(bar?.group).toBe('snacksAndSweets');
  expect(bar?.evidence).toEqual({ kind: 'yours' });
  expect(bar?.madeOf).toEqual([]);
  expect(within(sheet).getByText(/^Your food · Entered by you/)).toBeInTheDocument();
  // Edited, it keeps its group and its evidence; None takes the group away.
  await editSaved(sheet, 'Protein bar');
  expect(await within(sheet).findByRole('button', { name: /^Food group \(optional\)/ })).toHaveTextContent('Snacks and sweets');
  await userEvent.click(within(sheet).getByRole('button', { name: /^Food group \(optional\)/ }));
  await userEvent.click(await screen.findByRole('option', { name: 'None' }));
  await press(sheet, 'Save food');
  await expect.poll(async () => (await saved())[0]?.group).toBeUndefined();
  expect((await saved())[0]?.evidence).toEqual({ kind: 'yours' });
});

it('MM-710: an estimated food is marked to check in Saved, under Yours and on its amount step; About this food says what went into it', async () => {
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Buttermilk biscuit',
      kind: 'food',
      servingDescription: '1 biscuit',
      servingGrams: 60,
      perServing: new NutritionTotals({ kcal: 212, proteinG: 3.9, carbsG: 26.4, fatG: 9.8 }),
      group: 'breadsAndGrains',
      evidence: { kind: 'estimated', citation: 'Estimated from the ingredients' },
      madeOf: [{ name: 'All-purpose flour', grams: 30 }, { name: 'Butter' }],
    }),
  );
  const sheet = await open();
  await press(sheet, 'Saved');
  expect(await within(sheet).findByText(/^AI estimate, unverified · Estimated from the ingredients/)).toHaveClass('food-trust-doubtful');
  await press(sheet, 'Back');
  await typeIn(sheet, 'Search foods', 'buttermilk');
  expect(await within(sheet).findByText(/^AI estimate, unverified/)).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Buttermilk biscuit/ }));
  await within(sheet).findByRole('button', { name: 'Log it' });
  expect(within(sheet).getByText('Check this')).toBeInTheDocument();
  expect(within(sheet).getByText('AI estimate, unverified · Estimated from the ingredients.')).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: 'About this food' }));
  expect(within(sheet).getByText('Made of: All-purpose flour 30 g, Butter.')).toBeVisible();
});
