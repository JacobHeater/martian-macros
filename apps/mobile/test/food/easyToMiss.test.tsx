import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodSheet } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-152: the easy-to-miss line under a completed day. Carried over from
 * easy_to_miss_test.dart, with the case from under_eating_notice_test.dart
 * that hides it while logged days sit far below the floor (MM-114).
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function start({
  dayOfUse = 3,
  complete = true,
  eatingDisorderHistory = false,
}: { dayOfUse?: number; complete?: boolean; eatingDisorderHistory?: boolean } = {}): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({
      onboardedOn: today.addDays(-(dayOfUse - 1)),
      healthCheckConfirmedOn: today,
      screening: new ScreeningAnswers({ eatingDisorderHistory }),
    }),
  );
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(
    foodOn(today, { name: 'Soup', meal: 'lunch', kcal: 300, proteinG: 10, carbsG: 30, fatG: 5 }),
  );
  if (complete) await repos.dayMarks.setCompleteness(today, 'complete');
}

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Is this day fully logged?');
}

const line = () => screen.queryByText('Easy to miss');

it('the line appears under a completed day in the first weeks', async () => {
  await start();
  await openFood();
  expect(await screen.findByText('Easy to miss')).toBeInTheDocument();
  for (const item of ['cooking oil', 'drinks', 'sauces', 'bites and tastes']) {
    expect(screen.getByRole('button', { name: item })).toBeInTheDocument();
  }
  // Recorded once it is shown.
  await expect.poll(async () => (await first(repos.preferences.watchEasyToMiss())).lastShown).toBe(today);
});

it('it is not shown for a day that is not marked complete', async () => {
  await start({ complete: false });
  await openFood();
  expect(line()).not.toBeInTheDocument();
});

it('cooking oil opens add-food with oil searched', async () => {
  await start();
  await openFood();
  await userEvent.click(await screen.findByRole('button', { name: 'cooking oil' }));
  const sheet = await foodSheet();
  expect(within(sheet).getByRole('textbox', { name: 'Search foods' })).toHaveValue('oil');
});

it('bites and tastes opens the estimate sheet at Light', async () => {
  await start();
  await openFood();
  await userEvent.click(await screen.findByRole('button', { name: 'bites and tastes' }));
  const sheet = await foodSheet();
  expect(within(sheet).getByRole('heading', { name: 'Estimate a meal' })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /^Light · about/ })).toHaveAttribute('aria-pressed', 'true');
});

it('a month in, shown yesterday: not shown', async () => {
  await start({ dayOfUse: 30 });
  await repos.preferences.markEasyToMissShown(today.addDays(-1));
  await openFood();
  expect(line()).not.toBeInTheDocument();
});

it('a month in, not shown for a week: shown', async () => {
  await start({ dayOfUse: 30 });
  await repos.preferences.markEasyToMissShown(today.addDays(-8));
  await openFood();
  expect(await screen.findByText('Easy to miss')).toBeInTheDocument();
});

it('turned off in settings, it never appears', async () => {
  await start();
  await repos.preferences.saveEasyToMissEnabled(false);
  await openFood();
  expect(line()).not.toBeInTheDocument();
});

it('not shown with an eating-disorder history', async () => {
  await start({ eatingDisorderHistory: true });
  await openFood();
  expect(line()).not.toBeInTheDocument();
});

it('not shown while logged days sit far below the floor', async () => {
  await start({ dayOfUse: 41 });
  for (let i = 1; i <= 9; i++) {
    const day = today.addDays(-i);
    await repos.food.addFood(foodOn(day, { name: 'Food', kcal: 1050, proteinG: 80, carbsG: 100, fatG: 30 }));
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
  await repos.food.addFood(foodOn(today, { kcal: 2000, proteinG: 120, carbsG: 220, fatG: 70 }));
  await openFood();
  expect(line()).not.toBeInTheDocument();
});
