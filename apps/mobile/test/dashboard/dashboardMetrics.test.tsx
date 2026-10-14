import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { failing } from '../support/failing';
import { foodOn } from '../support/foodOn';
import { never } from '../support/never';
import { openDashboardHistory } from '../support/dashboardLoaded';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** The history under the Dashboard, one tap down since MM-254. Carried over from dashboard_metrics_test.dart. */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function seed(): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-60), { kcal: 2300, tdeeKcal: 2800, tdeeSigmaKcal: 170, tdeeStatus: 'updated' }),
  );
  for (let i = 0; i < 30; i++) {
    const date = today.addDays(-i);
    await repos.weights.saveWeight(date, 82 + i * 0.05);
    await repos.food.addFood(
      foodOn(date, { name: 'Recorded meal', meal: 'lunch', kcal: 2300, proteinG: 170, carbsG: 250, fatG: 70 }),
    );
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  await repos.waist.saveWaist(today.addDays(-20), 92);
  await repos.waist.saveWaist(today.addDays(-6), 90);
}

const historyCharts = () => document.querySelectorAll('.chart > svg.chart-plot');

it('a populated history shows every section', async () => {
  await seed();
  renderApp(repos, today);
  await openDashboardHistory();
  for (const title of [
    'Nutrition history',
    'Protein history',
    'Weight trend & uncertainty',
    'Waist history',
    'Logging coverage',
    'Coach & expenditure',
    'How you are holding up',
  ]) {
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  }
  expect(historyCharts()).toHaveLength(4);
  expect(
    screen.getByRole('img', { name: /Weight trend in lb, 30 days, with observations and uncertainty band\./ }),
  ).toBeInTheDocument();
});

it('the range control changes the chart and the recorded-day window', async () => {
  await seed();
  renderApp(repos, today);
  await openDashboardHistory();
  await screen.findByRole('heading', { name: 'Logging coverage' });
  expect(screen.getAllByText('30 / 30')).toHaveLength(4);
  await userEvent.click(screen.getByRole('button', { name: '7 days' }));
  expect(screen.getAllByText('7 / 7')).toHaveLength(4);
  expect(screen.getByRole('img', { name: /Weight trend in lb, 7 days/ })).toBeInTheDocument();
  expect(screen.getByText('Window').closest('div')).toHaveTextContent('7 days');
});

it('empty histories explain how to populate the sections', async () => {
  // Adults only: a minor is given no coaching estimate.
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  renderApp(repos, today);
  await openDashboardHistory();
  expect(await screen.findByText('Log food to populate your intake history.')).toBeInTheDocument();
  expect(screen.getAllByText('No records in this range yet.').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Not recorded').length).toBeGreaterThan(0);
  expect(screen.getByText('No coaching estimate available.')).toBeInTheDocument();
});

it('history that is still loading does not become an empty chart', async () => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  renderApp(repos, today, {
    change: (services) => ({
      ...services,
      intake: { ...services.intake, watchIntakeDays: () => never() },
    }),
  });
  await openDashboardHistory();
  expect(await screen.findByText('Loading your recorded metrics…')).toBeInTheDocument();
  expect(screen.queryByText('No records in this range yet.')).not.toBeInTheDocument();
});

it('history errors are visible, not an empty success', async () => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  renderApp(repos, today, {
    change: (services) => ({
      ...services,
      intake: { ...services.intake, watchIntakeDays: () => failing() },
    }),
  });
  await openDashboardHistory();
  expect(
    await screen.findByText('Dashboard history could not be loaded. Reopen the app to retry.'),
  ).toBeInTheDocument();
});

for (const failed of [false, true]) {
  // Carried over from pause_state_display_test.dart.
  it(`MM-183: the target display waits for pauses (${failed ? 'failed' : 'loading'})`, async () => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
    renderApp(repos, today, {
      change: (services) => ({
        ...services,
        pauses: {
          savePause: (pause) => services.pauses.savePause(pause),
          deletePause: (pause) => services.pauses.deletePause(pause),
          watchPauses: () => (failed ? failing() : never()),
        },
      }),
    });
    expect(
      await screen.findByText(
        failed ? 'Pause history could not be loaded. Reopen the app to retry.' : 'Loading pause history…',
      ),
    ).toBeInTheDocument();
    expect(document.querySelector('.mm-horizon')).toBeNull();
  });
}
