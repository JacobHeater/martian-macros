import { screen } from '@testing-library/react';
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
import { renderApp } from '../support/renderApp';

/** MM-641: one food of a logged meal taken out of it, to stand as its own food in the same slot. */
const today = CalendarDate.of(2026, 10, 26);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date: today, meal: 'dinner', eatenAt: 19 * 60, loggedMeal: { key: 'k1', name: 'Chicken and rice' } }));
  }
});

const rice = async () => (await first(repos.food.watchFood(today))).find((f) => f.name === 'White rice');

it('MM-641: rice taken out of the meal stays at dinner, at its time, as its own food; Undo puts it back', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'View Chicken and rice' }));
  await userEvent.click(await screen.findByRole('button', { name: 'More actions for White rice' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Take out of the meal' }));
  await expect.poll(async () => (await rice())?.loggedMeal).toBeUndefined();
  expect((await rice())?.meal).toBe('dinner');
  expect((await rice())?.eatenAt).toBe(19 * 60);
  const others = (await first(repos.food.watchFood(today))).filter((f) => f.name !== 'White rice');
  expect(others.every((f) => f.loggedMeal?.key === 'k1'), 'the rest stay the meal').toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await rice())?.loggedMeal?.key).toBe('k1');
});
