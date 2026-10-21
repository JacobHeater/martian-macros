import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { fiberLowScenario } from '../../src/gallery/screens/fiberLowScenario';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { renderApp } from '../support/renderApp';

/**
 * MM-126: the fiber insight on Today, from the app's own cells: on a cut at
 * Full detail it names foods already logged; below Full detail, where fiber
 * is not shown, it never appears.
 */
const today = CalendarDate.of(2026, 10, 5);

async function cutLowInFiber(): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await fiberLowScenario(repos, today);
  return repos;
}

it('at Full detail the insight speaks of fullness, with the user’s own foods', async () => {
  renderApp(await cutLowInFiber(), today);
  expect(await screen.findByText('Fiber, and staying full on a deficit')).toBeInTheDocument();
  expect(screen.getByText(/Some you already log: Raspberries and Lentil soup\./)).toBeInTheDocument();
});

it('at Standard detail there is no fiber insight', async () => {
  const repos = await cutLowInFiber();
  await repos.preferences.saveDetailLevel('standard');
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.queryByText('Fiber, and staying full on a deficit')).not.toBeInTheDocument();
});
