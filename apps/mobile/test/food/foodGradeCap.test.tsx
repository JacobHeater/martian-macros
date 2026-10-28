import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-660 (the owner, 2026-10-27): a fried food, by its name, and a sweet and
 * fatty one, by its numbers, grade no better than C- on the Food row, and
 * the popover says why. The numbers are the pack's own for the two foods
 * the owner logged: FNDDS "General Tso chicken" and "Chicken breast, fried,
 * coated, skin / coating eaten, from raw", as the pack of 2026-10-27 has them.
 */
const today = CalendarDate.of(2026, 10, 27);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

/** 100 g of a food as the pack states it per 100 g, logged weighed. */
const logged = (name: string, per100: { kcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; sodiumMg: number; sugars: number; saturatedFat: number }) =>
  repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'lunch',
      name,
      kcal: per100.kcal,
      proteinG: per100.proteinG,
      carbsG: per100.carbsG,
      fatG: per100.fatG,
      fiberG: per100.fiberG,
      sodiumMg: per100.sodiumMg,
      source: 'weighed',
      micros: new Micronutrients({ sugars: per100.sugars, saturatedFat: per100.saturatedFat }),
      portion: {
        method: 'weighed',
        basis: 'calculated',
        quantity: 100,
        unit: 'gram',
        reference: { basis: 'per100g', nutrition: new NutritionTotals({ kcal: per100.kcal, proteinG: per100.proteinG, carbsG: per100.carbsG, fatG: per100.fatG }) },
      },
    }),
  );

async function popoverOf(name: RegExp): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name }));
  return screen.findByRole('dialog');
}

it('General Tso chicken, mostly fat and sugar with little for it, is held to C- and the popover says so', async () => {
  await logged('General Tso chicken', { kcal: 295, proteinG: 12.9, carbsG: 23.99, fatG: 16.36, fiberG: 0.9, sodiumMg: 435, sugars: 11.6, saturatedFat: 2.76 });
  const dialog = await popoverOf(/^Grade C minus for General Tso chicken/);
  expect(within(dialog).getByText(/from what it gives per calorie/)).toHaveTextContent('Mostly fat and sugar, with little that counts for it, so no better than C-.');
});

it('breaded fried chicken breast, B- by its numbers, is held to C- by its name', async () => {
  await logged('Chicken breast, fried, coated, skin / coating eaten', { kcal: 243, proteinG: 21.46, carbsG: 6.01, fatG: 14.11, fiberG: 0.2, sodiumMg: 299, sugars: 0.1, saturatedFat: 2.77 });
  const dialog = await popoverOf(/^Grade C minus for Chicken breast, fried/);
  expect(within(dialog).getByText(/from what it gives per calorie/)).toHaveTextContent('Fried, battered or breaded, by its name, so no better than C-.');
});

it('grilled chicken breast with the same numbers keeps its letter: the words decide, never the fat', async () => {
  await logged('Chicken breast, grilled', { kcal: 243, proteinG: 21.46, carbsG: 6.01, fatG: 14.11, fiberG: 0.2, sodiumMg: 299, sugars: 0.1, saturatedFat: 2.77 });
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByRole('button', { name: /^Grade B minus for Chicken breast, grilled/ })).toBeInTheDocument();
});
