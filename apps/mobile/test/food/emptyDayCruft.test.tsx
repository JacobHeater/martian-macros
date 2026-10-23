import { screen, within } from '@testing-library/react';
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

/**
 * MM-389: the empty Food screen said what its layout already showed, and
 * its empty sections drew folds over nothing. MM-390: a past day still
 * said "today" to a screen reader and in the day's disclosure.
 */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('region', { name: 'Breakfast' });
}

it('an empty day carries no line narrating the empty meals or the Add button', async () => {
  await openFood();
  expect(screen.queryByText(/Nothing logged yet/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Start with breakfast/)).not.toBeInTheDocument();
});

it('an empty meal draws no fold, and keeps its heading and its Add button', async () => {
  await openFood();
  for (const meal of Meal.values) {
    const region = screen.getByRole('region', { name: mealLabel(meal) });
    expect(region.querySelector('[aria-expanded]'), `${meal} folds over nothing`).toBeNull();
    expect(within(region).getByRole('heading', { name: new RegExp(`^${mealLabel(meal)}`) })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: `Add food to ${mealLabel(meal).toLowerCase()}` })).toBeInTheDocument();
  }
  const water = screen.getByRole('region', { name: /^Water/ });
  expect(water.querySelector('[aria-expanded]'), 'water folds over nothing').toBeNull();
});

it('a meal with food still folds', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 300, proteinG: 10, carbsG: 50, fatG: 6 }));
  await openFood();
  const region = screen.getByRole('region', { name: 'Breakfast' });
  expect(within(region).getByRole('button', { name: /^Breakfast/ })).toHaveAttribute('aria-expanded', 'true');
});

it('on Food the calorie figure is spoken once, by its text, not again by the arc', async () => {
  await openFood();
  expect(document.querySelector('.mm-horizon')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.queryByRole('img', { name: /kcal left of/ })).not.toBeInTheDocument();
});

it('a past day says nothing about today, in the headings or the disclosure', async () => {
  await repos.food.addFood(foodOn(today.addDays(-1), { name: 'Oats', meal: 'breakfast', kcal: 300, proteinG: 10, carbsG: 50, fatG: 6 }));
  await openFood();
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  await screen.findByText('Oats');
  expect(screen.getByRole('heading', { level: 1, name: 'Yesterday' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /today/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^More about today/ })).not.toBeInTheDocument();
});

// MM-574: "More about this day" held two paragraphs explaining the app's own arithmetic; it is gone.
it('the Food screen has no "More about this day" fold', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 300, proteinG: 10, carbsG: 50, fatG: 6 }));
  await openFood();
  await screen.findByText('Oats');
  expect(screen.queryByRole('button', { name: /^More about/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/Partial days are left out of your metabolism estimate/)).not.toBeInTheDocument();
});

// MM-389, the product designer's PD-1: a fold left closed must not hide the first food of a meal that had none.
it('a meal folded on one day opens with its first food on a day it was empty', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 300, proteinG: 10, carbsG: 50, fatG: 6 }));
  await openFood();
  const breakfast = () => screen.getByRole('region', { name: 'Breakfast' });
  await userEvent.click(within(breakfast()).getByRole('button', { name: /^Breakfast/ }));
  expect(within(breakfast()).getByRole('button', { name: /^Breakfast/ })).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  await screen.findByRole('heading', { level: 1, name: 'Yesterday' });
  await repos.food.addFood(foodOn(today.addDays(-1), { name: 'Toast', meal: 'breakfast', kcal: 200, proteinG: 6, carbsG: 30, fatG: 4 }));
  expect(await screen.findByText('Toast')).toBeVisible();
});
