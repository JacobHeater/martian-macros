import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-562: a macro's top foods, with each one's meal; MM-563: a meal's subtotal names every macro. */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  const foods = [
    { name: 'Eggs', meal: 'breakfast', proteinG: 12, carbsG: 1, fatG: 10 },
    { name: 'Toast', meal: 'breakfast', proteinG: 4, carbsG: 30, fatG: 2 },
    { name: 'Chicken breast', meal: 'lunch', proteinG: 31, carbsG: 0, fatG: 4 },
    { name: 'Eggs', meal: 'dinner', proteinG: 6, carbsG: 1, fatG: 5 },
    { name: 'Greek yogurt', meal: 'snack', proteinG: 10, carbsG: 6, fatG: 0 },
    { name: 'Rice', meal: 'lunch', proteinG: 5, carbsG: 45, fatG: 1 },
    { name: 'Apple', meal: 'snack', proteinG: 0, carbsG: 25, fatG: 0 },
  ] as const;
  for (const food of foods) await repos.food.addFood(foodOn(today, { ...food, kcal: 200 }));
});

it('MM-562: pressing a macro opens its five top foods, most first, each with its meal as a chip', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const protein = await screen.findByRole('button', { name: /^Protein/, expanded: false });
  await userEvent.click(protein);
  const popover = await screen.findByRole('dialog', { name: 'Top foods for protein' });
  const rows = within(popover).getAllByRole('listitem');
  // Eggs at breakfast and at dinner are two lines: the meal is part of the food here.
  expect(rows.map((row) => row.textContent)).toEqual([
    'Chicken breastLunch31 g',
    'EggsBreakfast12 g',
    'Greek yogurtSnacks10 g',
    'EggsDinner6 g',
    'RiceLunch5 g',
  ]);
  expect(within(rows[0]!).getByText('Lunch')).toHaveClass('mm-chip-status');
  expect(protein).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(within(popover).getByRole('button', { name: 'Got it' }));
  expect(screen.queryByRole('dialog', { name: 'Top foods for protein' })).not.toBeInTheDocument();
});

it('MM-562: the split offers the same, from each macro of its legend', async () => {
  await repos.preferences.saveMacroPicture('donut');
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: /^Fat/ }));
  const popover = await screen.findByRole('dialog', { name: 'Top foods for fat' });
  expect(within(popover).getAllByRole('listitem')[0]).toHaveTextContent(/^EggsBreakfast10 g$/);
  expect(screen.queryByText('Share of calories from each')).not.toBeInTheDocument();
});

it('MM-563: a meal says its calories and every macro', async () => {
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText('400 kcal · P 16 · C 31 · F 12')).toBeInTheDocument();
});
