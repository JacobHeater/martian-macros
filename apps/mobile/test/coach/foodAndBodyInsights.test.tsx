import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import type { Meal } from '../../src/domain/Meal';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { targetsFrom } from '../support/targetsFrom';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-365, MM-367: the coach's lines under logged foods and the Dashboard's
 * waist and water rows, worked out from what was logged, with the
 * safeguards the panel asked for.
 */
const today = CalendarDate.of(2026, 10, 18);
let repos: InMemoryRepositories;

async function setUp(screening: ConstructorParameters<typeof ScreeningAnswers>[0] = {}): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today, screening: new ScreeningAnswers(screening) }).copyWith({ unitSystem: 'metric' }),
  );
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(targetsFrom(today.addDays(-30), { proteinMinimumG: 140 }));
}

const add = (meal: Meal, name: string, kcal: number, proteinG: number, carbsG: number, fatG: number) =>
  repos.food.addFood(new FoodEntry({ id: 0, date: today, meal, name, kcal, proteinG, carbsG, fatG, source: 'weighed' }));

const servings = (meal: Meal, name: string, count: number, kcal: number) =>
  repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal,
      name,
      kcal,
      proteinG: 8,
      carbsG: 40,
      fatG: 17,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: count,
        unit: 'serving',
        reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: kcal / count, proteinG: 2, carbsG: 10, fatG: 4 }), servingGrams: 30 },
      },
    }),
  );

beforeEach(() => setUp());

it('says under a logged food what the coach noticed, with the numbers behind it', async () => {
  await add('snack', 'Peanut butter', 190, 7, 7, 16);
  await add('lunch', 'Pasta with cream sauce', 640, 14, 70, 32);
  await servings('lunch', 'Garlic bread', 4, 350);
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText(/^Mostly fat: \d+ kcal, 76% from fat\./)).toBeInTheDocument();
  expect(screen.getByText(/^Light on protein: 640 kcal for 14 g\./)).toBeInTheDocument();
  expect(screen.getByText(/^Logged as 4 servings \(350 kcal\); one serving is 30 g/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /^Coach: Light on protein: 640 kcal for 14 g/ }));
  expect(screen.getByText('Your protein minimum')).toBeInTheDocument();
  expect(screen.getByText('140 g a day')).toBeInTheDocument();
});

it('with an eating-disorder history, only the protein line shows', async () => {
  await setUp({ eatingDisorderHistory: true });
  await add('snack', 'Peanut butter', 190, 7, 7, 16);
  await add('lunch', 'Pasta with cream sauce', 640, 14, 70, 32);
  await servings('lunch', 'Garlic bread', 4, 350);
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText(/^Light on protein: 640 kcal for 14 g\./)).toBeInTheDocument();
  expect(screen.queryByText(/^Mostly fat:/)).toBeNull();
  expect(screen.queryByText(/^Logged as/)).toBeNull();
});

it('with kidney disease, no protein line: the minimum is a ceiling there', async () => {
  await setUp({ chronicKidneyDisease: true });
  await add('lunch', 'Pasta with cream sauce', 640, 14, 70, 32);
  await add('snack', 'Peanut butter', 190, 7, 7, 16);
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText(/^Mostly fat:/)).toBeInTheDocument();
  expect(screen.queryByText(/^Light on protein: 640 kcal for 14 g/)).toBeNull();
});

it('an estimated entry gets no line', async () => {
  await repos.food.addFood(new FoodEntry({ id: 0, date: today, meal: 'dinner', name: 'Rich meal', kcal: 800, proteinG: 20, carbsG: 60, fatG: 44, source: 'quickAdd' }));
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Rich meal');
  expect(screen.queryByRole('button', { name: /^Coach:/ })).toBeNull();
});

it('the water row says when water was logged on few of the last 14 days', async () => {
  for (const daysAgo of [2, 5, 9, 12]) {
    const date = today.addDays(-daysAgo);
    await repos.water.addWater(new WaterEntry({ id: 0, date, ml: 500, at: new Date(2026, 9, 18 - daysAgo, 9) }));
  }
  renderApp(repos, today);
  expect(await screen.findByText(/^Water logged on 4 of the last 14 days/)).toBeInTheDocument();
});

// MM-393: biscuits logged as three servings, light on protein. The owner saw the portion check and not the
// protein line under the same entry: every rule that holds on an item gets its own line, the higher priority first.
const biscuits = () =>
  repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'breakfast',
      name: 'Biscuits',
      kcal: 780,
      proteinG: 12,
      carbsG: 78,
      fatG: 45,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: 3,
        unit: 'serving',
        reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 260, proteinG: 4, carbsG: 26, fatG: 15 }), servingGrams: 66 },
      },
    }),
  );

it('a food that two rules hold on shows both lines under it, the higher priority first', async () => {
  await biscuits();
  renderApp(repos, today);
  await openTab('Food');
  const portion = await screen.findByRole('button', { name: /^Coach: Logged as 3 servings \(780 kcal\)/ });
  const protein = screen.getByRole('button', { name: /^Coach: Light on protein: 780 kcal for 12 g/ });
  expect(portion.compareDocumentPosition(protein) & Node.DOCUMENT_POSITION_FOLLOWING, 'the portion check comes first').toBeTruthy();
  expect(portion.closest('.mm-swipe'), 'both lines sit under the one entry').toBe(protein.closest('.mm-swipe'));
});

it('snoozing one of two lines under a food leaves the other (MM-393, MM-378)', async () => {
  await biscuits();
  await repos.insightSnoozes.saveInsightSnooze({ kind: 'portionCheck', subject: 'Biscuits', item: 'Biscuits, breakfast', resumesOn: undefined });
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByRole('button', { name: /^Coach: Light on protein: 780 kcal for 12 g/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Coach: Logged as/ })).toBeNull();
});

// The UX guard's UX-2 on MM-393: snoozing the second of two lines leaves the focus on the first, not the page.
it('snoozing the second of two lines puts the focus on the first', async () => {
  await biscuits();
  renderApp(repos, today);
  await openTab('Food');
  const protein = await screen.findByRole('button', { name: /^Coach: Light on protein: 780 kcal for 12 g/ });
  await userEvent.click(protein);
  await userEvent.click(screen.getByRole('button', { name: /^Snooze… Light on protein for Biscuits/ }));
  const dialog = await screen.findByRole('dialog', { name: /^Snooze “Light on protein” for Biscuits/ });
  await userEvent.click(within(dialog).getByRole('option', { name: /^For a week/ }));
  await expect.poll(() => screen.queryByRole('button', { name: /^Coach: Light on protein: 780 kcal for 12 g/ })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Coach: Logged as 3 servings/ }));
});
