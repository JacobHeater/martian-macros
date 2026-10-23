import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-571, MM-572 (the owner's pick of the hero's stories, 2026-10-22): the day as a running total over the clock. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(targetsFrom(today.addDays(-40), { kcal: 2175 }));
});

const meals = async (date: CalendarDate, dinner: number) => {
  await repos.food.addFood(foodOn(date, { name: 'Biscuit', meal: 'breakfast', kcal: 675, eatenAt: 7 * 60 + 40 }));
  await repos.food.addFood(foodOn(date, { name: 'Chicken', meal: 'lunch', kcal: 713, eatenAt: 12 * 60 + 30 }));
  await repos.food.addFood(foodOn(date, { name: 'Pasta', meal: 'dinner', kcal: dinner, eatenAt: 19 * 60 + 15 }));
};

it('the figure is what was eaten, with what is over beside it, and when the target was passed', async () => {
  await meals(today, 1200);
  renderApp(repos, today, { hour: 21 });
  await openTab('Food');
  expect(await screen.findByText('kcal eaten')).toBeInTheDocument();
  expect(document.querySelector('.food-hero-figure')).toHaveTextContent('2,588');
  expect(screen.getByText('+413')).toBeInTheDocument();
  expect(screen.getByText('over 2,175')).toBeInTheDocument();
  expect(screen.getByText(/^You passed your target at dinner, 7:15 PM\./)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /^Running total: 2,588 kcal eaten, 675 after breakfast at 7:40 AM/ })).toBeInTheDocument();
});

// The owner, 2026-10-22: the usual day is built now and says openly what it waits for.
it('the usual day waits for 7 days with meal times, and says so with the count', async () => {
  await meals(today.addDays(-1), 900);
  await meals(today.addDays(-2), 900);
  await meals(today, 400);
  renderApp(repos, today, { hour: 21 });
  await openTab('Food');
  expect(await screen.findByText('Your usual day appears after 7 days with meal times · 2 of 7')).toBeInTheDocument();
});

it('with 7 days with meal times the usual day is drawn, and today is read against it', async () => {
  for (let i = 1; i <= 7; i++) await meals(today.addDays(-i), 900);
  await meals(today, 400);
  renderApp(repos, today, { hour: 21 });
  await openTab('Food');
  expect(await screen.findByText('Your usual day')).toBeInTheDocument();
  expect(document.querySelector('.chart-intake-usual')).not.toBeNull();
  // Usual by 9 PM: 675 + 713 + 900 = 2,288; today 1,788.
  expect(screen.getByText('500 kcal behind your usual day so far.')).toBeInTheDocument();
});

it('a food without a time stands at its meal’s usual time as an open dot', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 300 }));
  renderApp(repos, today, { hour: 12 });
  await openTab('Food');
  await screen.findByText('Oats');
  expect(document.querySelectorAll('.chart-intake-step-approximate')).toHaveLength(1);
  expect(screen.getByText('B ~8:00')).toBeInTheDocument();
});
