import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Meal } from '../../src/domain/Meal';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { mealLabel } from '../../src/format/mealLabel';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-125: each meal shows its protein, with a quiet marker and no target. From protein_across_meals_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

const eat = (meal: Meal, name: string, proteinG: number) =>
  repos.food.addFood(foodOn(today, { name, meal, kcal: 400, proteinG, carbsG: 30, fatG: 10 }));

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  // 80 kg: the marker is at 24 g.
  await repos.weights.saveWeight(today, 80);
  await eat('breakfast', 'Toast', 6);
  await eat('lunch', 'Chicken', 30);
});

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Chicken');
}

const marker = (meal: string) =>
  screen.getByRole('region', { name: meal }).querySelector('[aria-label="A solid serving of protein"]');

/** The meal's subtotal in the entries' letters (MM-563): "P 30 · C 30 · F 10". */
const subtotal = (meal: string) => screen.getByRole('region', { name: meal }).querySelector('.food-meal-total');

it('at Full, a lunch with 30 g carries the marker', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  await waitFor(() => expect(subtotal('Lunch')).toHaveTextContent(/^P 30 · /));
  expect(marker('Lunch')).not.toBeNull();
});

it('the marker, pressed, says what it means and what earns it (MM-597)', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  await waitFor(() => expect(subtotal('Lunch')).toHaveTextContent(/^P 30 · /));
  const lunch = marker('Lunch');
  if (!(lunch instanceof HTMLElement)) throw new Error('no marker on lunch');
  await userEvent.click(lunch);
  const said = await screen.findByRole('dialog', { name: 'A solid serving of protein' });
  expect(said).toHaveTextContent(/30 g of protein in this meal; \d+ g or more earns the mark/);
  expect(said).toHaveTextContent('Your daily total matters much more.');
  expect(screen.getByRole('button', { name: 'Lunch', expanded: true }), 'pressing the marker does not fold lunch').toBeInTheDocument();
});

it('a meal without it shows nothing in its place', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  await waitFor(() => expect(subtotal('Breakfast')).toHaveTextContent(/^P 6 · /));
  expect(marker('Breakfast')).toBeNull();
});

it('at Standard no meal has a marker', async () => {
  await openFood();
  for (const meal of Meal.values) expect(marker(mealLabel(meal))).toBeNull();
  expect(screen.queryByText(/g protein/)).not.toBeInTheDocument();
});

it('no meal ever shows a protein target', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  await waitFor(() => expect(document.querySelectorAll('.food-meal-total').length).toBeGreaterThan(0));
  const headers = Array.from(document.querySelectorAll('.food-meal-total'), (line) => line.textContent ?? '').join(' ').toLowerCase();
  expect(headers).not.toBe('');
  for (const word of ['target', 'of ', '/', 'goal', 'min']) expect(headers, word).not.toContain(word);
});

it('for a heavy person the marker is per kg of reference weight', async () => {
  // 130 kg at 180 cm: about 93 kg of reference weight, so the marker is at about 28 g.
  await repos.weights.saveWeight(today, 130);
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  await waitFor(() => expect(subtotal('Lunch')).toHaveTextContent(/^P 30 · /));
  expect(marker('Lunch')).not.toBeNull();
});
