import { readFileSync } from 'node:fs';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodSheet } from '../support/addFood';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-439: recent foods were one row of chips that scrolled sideways, each
 * as wide as its name, so long names made a very long scroll. They are
 * list rows now, the five newest first.
 */
const today = CalendarDate.of(2026, 10, 5);
const long = 'Grilled chicken thigh with roasted sweet potato, broccoli and garlic yogurt sauce';
const names = ['Oats', 'Banana', 'Greek yogurt', long, 'Rice', 'Salmon', 'Apple', 'Toast'];
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  for (const name of names) await repos.food.addFood(foodOn(today.addDays(-1), { name, kcal: 300 }));
});

async function openSheet(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Add food to lunch' }));
  return foodSheet();
}

it('lists the five newest recent foods as rows, and the rest on asking', async () => {
  const sheet = await openSheet();
  const inSheet = within(sheet);
  await inSheet.findByText('Recent foods');
  const rows = () => inSheet.queryAllByRole('button', { name: /Your recent food/ });
  // Newest first: the last logged comes first.
  expect(rows().map((row) => row.querySelector('.mm-list-row-title')?.textContent)).toEqual(
    ['Toast', 'Apple', 'Salmon', 'Rice', long],
  );
  await userEvent.click(inSheet.getByRole('button', { name: 'More recent foods' }));
  expect(rows()).toHaveLength(names.length);
  expect(inSheet.queryByRole('button', { name: 'More recent foods' })).not.toBeInTheDocument();
});

it('a recent food’s row fills the form', async () => {
  const sheet = await openSheet();
  const inSheet = within(sheet);
  await userEvent.click(await inSheet.findByRole('button', { name: /^Toast/ }));
  expect(inSheet.getByRole('textbox', { name: 'Food name' })).toHaveValue('Toast');
});

it('nothing in the food stylesheet scrolls sideways', () => {
  const css = readFileSync('src/food/food.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(css).not.toMatch(/overflow-x:\s*(?:auto|scroll)/);
});

// MM-629: a recent row says the amount it repeats, as the meal's row says it.
it('MM-629: a recent food says the amount it repeats', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today.addDays(-1),
      meal: 'breakfast',
      name: 'Greek yogurt',
      kcal: 100,
      proteinG: 17,
      carbsG: 6,
      fatG: 0.7,
      source: 'labelServing',
      portion: {
        method: 'labelServing',
        basis: 'calculated',
        quantity: 1,
        unit: 'serving',
        reference: {
          basis: 'perServing',
          servingUnit: 'serving',
          servingDescription: '1 container',
          servingGrams: 170,
          nutrition: new NutritionTotals({ kcal: 100, proteinG: 17, carbsG: 6, fatG: 0.7 }),
        },
      },
    }),
  );
  const sheet = await openSheet();
  expect(await within(sheet).findByRole('button', { name: /^Greek yogurt.*Your recent food · 1 × 1 container · 170 g · 100 kcal/ })).toBeInTheDocument();
});

// MM-629: what was last logged at the meal being added to comes first.
it('MM-629: the foods last logged at this meal list first, newest first among them', async () => {
  await repos.food.addFood(foodOn(today.addDays(-1), { name: 'Leftover rice', meal: 'lunch', kcal: 300 }));
  const sheet = await openSheet();
  const inSheet = within(sheet);
  await inSheet.findByText('Recent foods');
  const titles = inSheet.queryAllByRole('button', { name: /Your recent food/ }).map((row) => row.querySelector('.mm-list-row-title')?.textContent);
  // Opened from lunch's "+": the one lunch food first, then the dinner foods newest first.
  expect(titles.slice(0, 3)).toEqual(['Leftover rice', 'Toast', 'Apple']);
});

