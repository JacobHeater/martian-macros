import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-392: an unmarked day's completeness row says what the metabolism estimate does with it, like its siblings. */
it('an unmarked day says it is counted unless it looks unfinished, and does not ask to be pressed', async () => {
  const today = CalendarDate.of(2026, 10, 5);
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 400, proteinG: 14, carbsG: 60, fatG: 8 }));
  renderApp(repos, today);
  await openTab('Food');
  const row = await screen.findByRole('button', { name: /^Is this day fully logged\?/ });
  expect(row).toHaveTextContent('Counted unless it looks unfinished.');
  expect(row).not.toHaveTextContent(/Mark it/);
});
