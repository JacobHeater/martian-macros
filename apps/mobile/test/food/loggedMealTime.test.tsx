import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { clockTurnOf, turnClock } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-626: a food's time eaten "can be changed, never cleared" (MM-570), but
 * the foods of a logged meal open only in View meal, which has no time, and
 * moving the meal to another day clears it (MM-587) with no way to give it
 * again. Skipped until MM-626 is fixed: it fails on main at f5a08b4.
 */
const today = CalendarDate.of(2026, 10, 22);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  const loggedMeal = { key: 'k1', name: 'Chicken and rice' };
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date: today, meal: 'dinner', eatenAt: 19 * 60, loggedMeal }));
  }
});

it.skip('MM-626: a logged meal’s time is changed in View meal, for every food of it', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'View Chicken and rice' }));
  const sheet = await screen.findByRole('dialog', { name: 'View meal' });
  await userEvent.click(within(sheet).getByRole('button', { name: /^Time eaten/ }));
  const clock = await screen.findByRole('dialog', { name: 'Time eaten' });
  await turnClock(clock, clockTurnOf('18:30'));
  await userEvent.click(within(clock).getByRole('button', { name: 'OK' }));
  await expect.poll(async () => (await first(repos.food.watchFood(today))).map((f) => f.eatenAt)).toEqual([18 * 60 + 30, 18 * 60 + 30, 18 * 60 + 30]);
});
