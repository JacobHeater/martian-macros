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
 * MM-575 (the owner, 2026-10-22): the easy-to-miss foods are asked about as a
 * day is marked complete, and only "nothing missed" marks it; a missed one
 * opens add-food. MM-152's schedule and MM-114's exceptions still decide when
 * the check is due. The chips under a completed day are gone.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function start({
  dayOfUse = 3,
  eatingDisorderHistory = false,
}: { dayOfUse?: number; eatingDisorderHistory?: boolean } = {}): Promise<void> {
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
  await repos.food.addFood(foodOn(today, { name: 'Soup', meal: 'lunch', kcal: 2000, proteinG: 100, carbsG: 200, fatG: 60 }));
}

/** Opens Food and chooses Complete on the day's row; gives the dialog that comes next, if any. */
async function chooseComplete(): Promise<HTMLElement | null> {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: /^Is this day fully logged\?/ }));
  const options = await screen.findByRole('dialog', { name: 'Is this day fully logged?' });
  await userEvent.click(within(options).getByRole('option', { name: 'Complete' }));
  await expect.poll(() => screen.queryByRole('dialog', { name: 'Is this day fully logged?' })).toBeNull();
  return screen.queryByRole('dialog', { name: 'Anything easy to miss?' });
}

const marked = () => first(repos.dayMarks.watchCompleteness(today));

it('marking a day complete asks about the easy-to-miss foods, and nothing missed marks it', async () => {
  await start();
  const check = await chooseComplete();
  expect(check).not.toBeNull();
  for (const item of ['Cooking oil', 'Drinks', 'Sauces', 'Bites and tastes']) {
    expect(within(check!).getByRole('button', { name: item })).toBeInTheDocument();
  }
  expect(await marked()).toBe('unmarked');
  await userEvent.click(within(check!).getByRole('button', { name: 'Nothing missed, mark complete' }));
  await expect.poll(marked).toBe('complete');
  expect(await first(repos.preferences.watchEasyToMiss())).toMatchObject({ lastShown: today });
});

it('a missed food opens add-food on it, and the day is not marked', async () => {
  await start();
  const check = await chooseComplete();
  await userEvent.click(within(check!).getByRole('button', { name: 'Cooking oil' }));
  const sheet = await foodSheet();
  expect(within(sheet).getByRole('textbox', { name: 'Search foods' })).toHaveValue('oil');
  expect(await marked()).toBe('unmarked');
});

it('bites and tastes opens the estimate sheet at Light', async () => {
  await start();
  const check = await chooseComplete();
  await userEvent.click(within(check!).getByRole('button', { name: 'Bites and tastes' }));
  const sheet = await foodSheet();
  expect(within(sheet).getByRole('heading', { name: 'Estimate a meal' })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /^Light · about/ })).toHaveAttribute('aria-pressed', 'true');
});

it('closing the check marks nothing', async () => {
  await start();
  await chooseComplete();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => screen.queryByRole('dialog')).toBeNull();
  expect(await marked()).toBe('unmarked');
});

it('the chips under a completed day are gone', async () => {
  await start();
  await repos.dayMarks.setCompleteness(today, 'complete');
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Soup');
  expect(screen.queryByText('Easy to miss')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'cooking oil' })).not.toBeInTheDocument();
});

it('a month in, asked yesterday: marked at once', async () => {
  await start({ dayOfUse: 30 });
  await repos.preferences.markEasyToMissShown(today.addDays(-1));
  expect(await chooseComplete()).toBeNull();
  await expect.poll(marked).toBe('complete');
});

it('a month in, not asked for a week: asked', async () => {
  await start({ dayOfUse: 30 });
  await repos.preferences.markEasyToMissShown(today.addDays(-8));
  expect(await chooseComplete()).not.toBeNull();
});

it('turned off in settings, never asked', async () => {
  await start();
  await repos.preferences.saveEasyToMissEnabled(false);
  expect(await chooseComplete()).toBeNull();
  await expect.poll(marked).toBe('complete');
});

it('never asked with an eating-disorder history', async () => {
  await start({ eatingDisorderHistory: true });
  expect(await chooseComplete()).toBeNull();
  await expect.poll(marked).toBe('complete');
});

it('never asked while logged days sit far below the floor', async () => {
  await start({ dayOfUse: 41 });
  for (let i = 1; i <= 9; i++) {
    const day = today.addDays(-i);
    await repos.food.addFood(foodOn(day, { name: 'Food', kcal: 1050, proteinG: 80, carbsG: 100, fatG: 30 }));
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
  expect(await chooseComplete()).toBeNull();
});
