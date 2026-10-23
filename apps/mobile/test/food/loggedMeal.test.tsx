import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { LoggedMeal } from '../../src/domain/food/meal/LoggedMeal';
import type { MealItemDraft } from '../../src/domain/food/meal/MealItemDraft';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { Meal } from '../../src/domain/Meal';
import { gradeOfFoodEntry } from '../../src/engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../../src/engine/gradeOfMeal';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { entriesCopiedTo } from '../../src/food/entriesCopiedTo';
import { gradeOfLoggedMeal } from '../../src/food/meal/gradeOfLoggedMeal';
import { Fmt } from '../../src/format/Fmt';
import { toStringAsFixed } from '../../src/lang/toStringAsFixed';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-587: a logged meal as one row in its slot, opened to its foods in View meal. */
const today = CalendarDate.of(2026, 10, 22);
let repos: InMemoryRepositories;

const items = (): readonly MealItemDraft[] => {
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  return reading.draft.items;
};

/** "Chicken and rice" (522 kcal, three foods) logged to `meal` on `date`, under `key`. */
async function logChickenAndRice(date = today, meal: Meal = 'dinner', key = 'k1', only?: number): Promise<void> {
  const loggedMeal = { key, name: 'Chicken and rice' };
  for (const item of items().slice(0, only)) await repos.food.addFood(entryOfMealItem(item, { date, meal, eatenAt: 19 * 60, loggedMeal }));
}

const logged = async (date = today) => first(repos.food.watchFood(date));

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** Opens Food with the meal logged, then View meal from the row. */
async function viewMeal(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'View Chicken and rice' }));
  return screen.findByRole('dialog', { name: 'View meal' });
}

it('a meal is one row in its slot, with its foods counted, and the slot’s total counts every food', async () => {
  await logChickenAndRice();
  renderApp(repos, today);
  await openTab('Food');
  const row = await screen.findByRole('button', { name: 'View Chicken and rice' });
  expect(within(row).getByText(/^Meal · 3 foods · P /)).toBeInTheDocument();
  expect(within(row).getByText('522')).toBeInTheDocument();
  expect(screen.queryByText('White rice'), 'the foods are not rows of their own').toBeNull();
  expect(within(screen.getByRole('region', { name: 'Dinner' })).getByText('522 kcal')).toBeInTheDocument();
});

it('the row’s menu offers View meal and Delete', async () => {
  await logChickenAndRice();
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'More actions for Chicken and rice' }));
  expect(screen.getByRole('menuitem', { name: 'View meal' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('menuitem', { name: 'View meal' }));
  expect(await screen.findByRole('dialog', { name: 'View meal' })).toBeInTheDocument();
});

it('View meal shows each food with where its numbers came from', async () => {
  await logChickenAndRice();
  const sheet = await viewMeal();
  expect(within(sheet).getByRole('heading', { name: 'Chicken and rice' })).toBeInTheDocument();
  expect(within(sheet).getByText('White rice')).toBeInTheDocument();
  expect(within(sheet).getByText(/^Cited by the AI · USDA/)).toBeInTheDocument();
  expect(within(sheet).getByText(/^522 kcal · /)).toBeInTheDocument();
  // The grade on a row of its own, said what it is; the sheet's ✕ closes it, with no second Close beside Delete meal.
  expect(within(sheet).getByText('Meal grade')).toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'Close' })).toBeNull();
});

it('View meal shows the meal’s macro split, drawn again from the foods that remain when one is removed (MM-597)', async () => {
  await logChickenAndRice();
  const sheet = await viewMeal();
  expect(within(sheet).getByText('Macro split')).toBeInTheDocument();
  const ring = within(sheet).getByRole('img', { name: /^Logged macronutrient energy split\. / });
  const before = ring.getAttribute('aria-label') ?? '';
  expect(before).toMatch(/Protein: .+ · .+%\. Carbs: .+ · .+%\. Fat: .+ · .+%\.$/);
  await press(sheet, 'More actions for White rice');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
  await expect
    .poll(() => within(sheet).getByRole('img', { name: /^Logged macronutrient energy split\. / }).getAttribute('aria-label'))
    .not.toBe(before);
});

it('a slot’s menu opens the macro split of everything in it, its meal’s foods and its own (MM-597)', async () => {
  await logChickenAndRice();
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today, meal: 'dinner', name: 'Olive oil', kcal: 120, proteinG: 0, carbsG: 0, fatG: 14, source: 'labelServing' }),
  );
  renderApp(repos, today);
  await openTab('Food');
  const options = await screen.findByRole('button', { name: 'Options for dinner' });
  // The fold is the title and its arrow, described by the summary beside it (MM-597).
  const fold = screen.getByRole('button', { name: 'Dinner', expanded: true });
  expect(fold).toHaveAccessibleDescription(/^642 kcal/);
  expect(fold.querySelector('.mm-section-title-line .mm-disclosure-chevron')).not.toBeNull();
  expect(screen.queryByRole('button', { name: 'Options for breakfast' }), 'an empty slot has no menu').toBeNull();
  await userEvent.click(options);
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Macro split' }));
  const sheet = await screen.findByRole('dialog', { name: 'Macro split' });
  expect(within(sheet).getByRole('heading', { name: 'Dinner' })).toBeInTheDocument();
  const ring = within(sheet).getByRole('img', { name: /^Logged macronutrient energy split\. / });
  const meal = new LoggedMeal((await logged()).filter((entry) => entry.loggedMeal !== undefined));
  const fat = meal.fatG + 14;
  const energy = meal.proteinG * 4 + meal.carbsG * 4 + fat * 9;
  expect(ring.getAttribute('aria-label')).toContain(`Fat: ${Fmt.grams(fat)} · ${toStringAsFixed((100 * fat * 9) / energy, 1)}%`);
});

it('a food’s grams changed in View meal halves its numbers, and the meal follows', async () => {
  await logChickenAndRice();
  const sheet = await viewMeal();
  await press(sheet, 'More actions for White rice');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change' }));
  await typeIn(sheet, 'Grams eaten', '93');
  await press(sheet, 'Save food');
  await expect.poll(async () => (await logged()).find((f) => f.name === 'White rice')?.kcal).toBe(121);
  const rice = (await logged()).find((f) => f.name === 'White rice');
  expect(rice?.portion?.quantity).toBe(93);
  expect(rice?.loggedMeal?.name).toBe('Chicken and rice');
  expect(await within(sheet).findByText(/^401 kcal · /)).toBeInTheDocument();
});

it('removing the last food asks first, and confirming deletes the meal', async () => {
  await logChickenAndRice(today, 'dinner', 'k1', 1);
  const sheet = await viewMeal();
  await press(sheet, 'More actions for Grilled chicken breast');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
  const ask = await screen.findByRole('dialog', { name: 'Delete this meal?' });
  expect(within(ask).getByText(/Removing it deletes the meal\./)).toBeInTheDocument();
  await userEvent.click(within(ask).getByRole('button', { name: 'Delete meal' }));
  await expect.poll(async () => (await logged()).length).toBe(0);
});

it('a meal moved to lunch has every food in lunch', async () => {
  await logChickenAndRice();
  const sheet = await viewMeal();
  await userEvent.click(within(within(sheet).getByRole('group', { name: 'Meal' })).getByRole('button', { name: 'Lunch' }));
  await expect.poll(async () => (await logged()).map((f) => f.meal)).toEqual(['lunch', 'lunch', 'lunch']);
});

it('a meal renamed renames every food’s meal', async () => {
  await logChickenAndRice();
  const sheet = await viewMeal();
  await typeIn(sheet, 'Meal name', 'Gym dinner{Enter}');
  await expect.poll(async () => (await logged()).map((f) => f.loggedMeal?.name)).toEqual(['Gym dinner', 'Gym dinner', 'Gym dinner']);
});

it('a meal deleted goes whole, and Undo puts it back as the same meal', async () => {
  await logChickenAndRice();
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'More actions for Chicken and rice' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
  await expect.poll(async () => (await logged()).length).toBe(0);
  await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await logged()).length).toBe(3);
  expect((await logged()).every((f) => f.loggedMeal?.key === 'k1')).toBe(true);
});

it('a meal from Recent foods is logged again to the open slot and day, as a new meal, in one press', async () => {
  await logChickenAndRice(today.addDays(-1));
  renderApp(repos, today);
  const sheet = await openAddFood('lunch');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Chicken and rice/ }));
  await expect.poll(async () => (await logged()).length).toBe(3);
  const again = await logged();
  expect(again.every((f) => f.meal === 'lunch' && f.loggedMeal?.name === 'Chicken and rice')).toBe(true);
  expect(again[0]?.loggedMeal?.key, 'a new meal').not.toBe('k1');
  expect(new Set(again.map((f) => f.loggedMeal?.key)).size).toBe(1);
});

it('a saved copy is apart from the logged meal: changing a food leaves it as it was', async () => {
  await logChickenAndRice();
  const sheet = await viewMeal();
  await press(sheet, 'Save to Saved');
  await expect.poll(async () => (await first(repos.customFoods.watchCustomFoods())).length).toBe(1);
  await press(sheet, 'More actions for White rice');
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
  await expect.poll(async () => (await logged()).length).toBe(2);
  const [recipe] = await first(repos.customFoods.watchCustomFoods());
  expect(recipe?.ingredients.map((i) => i.name)).toEqual(['Grilled chicken breast', 'White rice', 'Steamed broccoli']);
});

it('copying a slot to another day copies its meal as a new meal', () => {
  const tag = { key: 'k1', name: 'Taco night' };
  const copies = entriesCopiedTo(today, [
    foodOn(today.addDays(-1), { name: 'Rice' }).copyWith({ loggedMeal: tag }),
    foodOn(today.addDays(-1), { name: 'Beans' }).copyWith({ loggedMeal: tag }),
    foodOn(today.addDays(-1), { name: 'Tea' }),
  ]);
  const [rice, beans, tea] = copies;
  expect(rice?.loggedMeal?.key).not.toBe('k1');
  expect(beans?.loggedMeal).toEqual(rice?.loggedMeal);
  expect(rice?.loggedMeal?.name).toBe('Taco night');
  expect(tea?.loggedMeal).toBeUndefined();
});

it('a meal’s grade counts each food by its calories, as a slot’s does', () => {
  const b = { kcal: 600, proteinG: 30, carbsG: 60, fatG: 26, fiberG: 6, sugars: 6, saturatedFat: 3, sodium: 400, grams: 400 };
  const d = { kcal: 50, proteinG: 0, carbsG: 13, fatG: 0, fiberG: 0, sugars: 13, saturatedFat: 0, sodium: 0, grams: 12 };
  const entry = (n: typeof b, name: string) =>
    entryOfMealItem(
      {
        name,
        grams: n.grams,
        kcal: n.kcal,
        proteinG: n.proteinG,
        carbsG: n.carbsG,
        fatG: n.fatG,
        fiberG: n.fiberG,
        micros: new Micronutrients({ sugars: n.sugars, saturatedFat: n.saturatedFat, sodium: n.sodium }),
        evidence: { kind: 'yours' },
      },
      { date: today, meal: 'dinner', eatenAt: undefined, loggedMeal: { key: 'k1', name: 'Plate' } },
    );
  const meal = new LoggedMeal([entry(b, 'Stew'), entry(d, 'Candy')]);
  expect(gradeOfLoggedMeal(meal)).toEqual(gradeOfMeal(meal.items.map((i) => ({ kcal: i.kcal, grade: gradeOfFoodEntry(i) })), 'meal'));
  expect(gradeOfLoggedMeal(meal)?.kind).toBe('graded');
});
