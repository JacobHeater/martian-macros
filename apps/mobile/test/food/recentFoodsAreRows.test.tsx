import { readFileSync } from 'node:fs';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
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
