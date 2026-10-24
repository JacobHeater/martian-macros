import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { renderApp } from '../support/renderApp';

/** MM-596: search finds everything ever logged, not only the twenty recent foods and five recent meals. */
const today = CalendarDate.of(2026, 10, 22);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** "Chicken and rice", analysed and logged on `date`. */
async function logMeal(date: CalendarDate, key: string): Promise<void> {
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date, meal: 'dinner', eatenAt: undefined, loggedMeal: { key, name: reading.draft.name } }));
  }
}

it('MM-596: a food typed in months ago, behind thirty newer ones, is found', async () => {
  await repos.food.addFood(foodOn(today.addDays(-120), { name: 'Grandma’s lasagna', kcal: 640 }));
  for (let i = 0; i < 30; i++) await repos.food.addFood(foodOn(today.addDays(-1), { name: `Snack ${i}`, kcal: 100 }));
  renderApp(repos, today);
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', 'lasagna');
  expect(await within(sheet).findByRole('button', { name: /^Grandma’s lasagna.*From your log · 640 kcal/ })).toBeInTheDocument();
});

it('MM-596: a food of an analysed meal is found by its own name, and comes back as one usual portion', async () => {
  await logMeal(today.addDays(-3), 'k1');
  renderApp(repos, today);
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', 'white rice');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^White rice.*From your log/ }));
  // The meal had 186 g of it; it comes back as its usual portion, 1 cup of 158 g (MM-595).
  expect(within(sheet).getByRole('button', { name: '1 cup', pressed: true })).toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  const [rice] = await first(repos.food.watchFood(today));
  expect(rice?.portion?.reference?.servingGrams).toBe(158);
  expect(rice?.kcal).toBeCloseTo((242 / 186) * 158, 6);
  expect(rice?.loggedMeal, 'a food on its own now').toBeUndefined();
});

it('MM-596: a meal behind five newer ones is found, and logged again in one press', async () => {
  await logMeal(today.addDays(-30), 'old');
  for (let i = 0; i < 6; i++) {
    await repos.food.addFood(foodOn(today.addDays(-1), { name: `Toast ${i}` }).copyWith({ loggedMeal: { key: `m${i}`, name: `Breakfast ${i}` } }));
  }
  renderApp(repos, today);
  const sheet = await openAddFood('lunch');
  await typeIn(sheet, 'Search foods', 'chicken and');
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Chicken and rice.*From your log · 3 foods/ }));
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(3);
  expect(screen.getByText('Logged Chicken and rice')).toBeInTheDocument();
});
