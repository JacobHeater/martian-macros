import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { waitingRead } from '../../src/gallery/screens/waitingRead';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-343: weighed, with the weight events still being read: the trend waits, and never asks for a weigh-in. */
it('a trend still being worked out does not ask for a weigh-in', async () => {
  const today = CalendarDate.of(2026, 10, 10);
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-20), healthCheckConfirmedOn: today }));
  for (let d = 20; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 84);
  renderApp(repos, today, { change: waitingRead('weightEvents', 'watchWeightEvents') });
  await openTab('Progress');
  expect(await screen.findByText('Weight trend')).toBeInTheDocument();
  expect(screen.queryByText('Log a weigh-in to start your trend.')).not.toBeInTheDocument();
});
