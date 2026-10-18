import { screen } from '@testing-library/react';
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
  expect(await screen.findByText(/^Most of this food’s calories come from fat \(76%\)/)).toBeInTheDocument();
  expect(screen.getByText(/^14 g of protein in 640 kcal/)).toBeInTheDocument();
  expect(screen.getByText(/^Logged as 4 servings \(350 kcal\); one serving is 30 g/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /^Coach: 14 g of protein/ }));
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
  expect(await screen.findByText(/^14 g of protein in 640 kcal/)).toBeInTheDocument();
  expect(screen.queryByText(/^Most of this food/)).toBeNull();
  expect(screen.queryByText(/^Logged as/)).toBeNull();
});

it('with kidney disease, no protein line: the minimum is a ceiling there', async () => {
  await setUp({ chronicKidneyDisease: true });
  await add('lunch', 'Pasta with cream sauce', 640, 14, 70, 32);
  await add('snack', 'Peanut butter', 190, 7, 7, 16);
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText(/^Most of this food/)).toBeInTheDocument();
  expect(screen.queryByText(/^14 g of protein/)).toBeNull();
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
