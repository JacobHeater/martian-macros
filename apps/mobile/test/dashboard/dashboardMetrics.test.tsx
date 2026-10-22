import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
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
  // MM-335: sections of the Dashboard's hierarchy, with no headline of their own.
  for (const title of ['Intake', 'Protein', 'Weight trend', 'Waist', 'Logging', 'Coach and expenditure', 'How you are holding up']) {
    expect(await screen.findByText(title, { selector: '.mm-section-title' })).toBeInTheDocument();
  }
  expect(screen.queryByRole('heading', { name: 'Your metrics' })).not.toBeInTheDocument();
  expect(document.querySelector('.mm-disclosure .mm-info-card')).toBeNull();
  expect(historyCharts()).toHaveLength(4);
  expect(
    screen.getByRole('img', { name: /Weight trend in lb, 30 days, with observations and uncertainty band\./ }),
  ).toBeInTheDocument();
});

it('the range control changes the chart and the recorded-day window', async () => {
  await seed();
  renderApp(repos, today);
  await openDashboardHistory();
  expect(await screen.findByText('30 of 30 days with food logged')).toBeInTheDocument();
  expect(screen.getByText('2,300 kcal a day on average, over 30 days')).toBeInTheDocument();
  // MM-176: every average says how many recorded days it uses.
  expect(screen.getByText('170 g a day on average, over 30 days')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '7 days' }));
  expect(await screen.findByText('7 of 7 days with food logged')).toBeInTheDocument();
  expect(screen.getAllByText('7 of 7')).toHaveLength(2);
  expect(screen.getByRole('img', { name: /Weight trend in lb, 7 days/ })).toBeInTheDocument();
});

it('empty histories explain how to populate the sections', async () => {
  // Adults only: a minor is given no coaching estimate.
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  renderApp(repos, today);
  await openDashboardHistory();
  // MM-335: each section's summary says what it is waiting for; nothing bare on the canvas.
  expect(await screen.findByText('Nothing logged in these days yet')).toBeInTheDocument();
  expect(screen.getByText('No protein logged in these days yet')).toBeInTheDocument();
  expect(screen.getByText('Not measured in these days')).toBeInTheDocument();
  expect(screen.getByText('No food logged yet today')).toBeInTheDocument();
  expect(screen.getByText('No estimate yet')).toBeInTheDocument();
  expect(document.querySelector('.mm-disclosure svg.chart-plot')).toBeNull();
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
  expect(await screen.findByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
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
  expect(await screen.findByText('Could not read your history')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

for (const failed of [false, true]) {
  // Carried over from pause_state_display_test.dart.
  it(`MM-183: the target display waits for pauses (${failed ? 'failed' : 'loading'})`, async () => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(targetsFrom(today.addDays(-3), { kcal: 2000 }));
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
    if (failed) {
      // MM-334: the day stays, its targets withheld and the reason said.
      expect(await screen.findByText('Could not check whether today is paused')).toBeInTheDocument();
      expect(screen.queryByText(/^kcal (left|over) of/)).toBeNull();
      expect(screen.getByText('kcal logged')).toBeInTheDocument();
    } else {
      expect(await screen.findByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
      expect(document.querySelector('.mm-horizon')).toBeNull();
    }
  });
}

it('MM-335: today, still being logged, is an open dot apart from the line, not a whole day', async () => {
  await seed();
  await repos.dayMarks.setCompleteness(today, 'unmarked');
  renderApp(repos, today);
  await openDashboardHistory();
  expect((await screen.findAllByText(/^○ Today so far/)).length).toBeGreaterThan(0);
  expect(document.querySelectorAll('.chart-energy .chart-dot-unfinished')).toHaveLength(1);
  expect(screen.getByText('2,300 kcal a day on average, over 29 days')).toBeInTheDocument();
  expect(screen.getByText('170 g a day on average, over 29 days')).toBeInTheDocument();
});

it('MM-335: today alone, still being logged, is said as today so far, not as nothing', async () => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  await repos.food.addFood(foodOn(today, { name: 'Oats', meal: 'breakfast', kcal: 640, proteinG: 20, carbsG: 100, fatG: 12 }));
  renderApp(repos, today);
  await openDashboardHistory();
  expect(await screen.findByText('Today so far: 640 kcal · counts once marked complete')).toBeInTheDocument();
  expect(screen.queryByText('Nothing logged in these days yet')).not.toBeInTheDocument();
});

it('MM-335: a header that opens a tab stays a heading, and says where it goes', async () => {
  await seed();
  renderApp(repos, today);
  await openDashboardHistory();
  const intake = await screen.findByRole('button', { name: 'Intake' });
  expect(intake).toHaveAccessibleDescription(/a day on average, over 30 days Opens Food$/);
  expect(intake.closest('h2')).not.toBeNull();
});

it('MM-353: nothing of the recovery section is drawn outside it', async () => {
  await seed();
  await repos.recovery.saveRecoveryCheckIn(new RecoveryCheckIn({ date: today.addDays(-3), hunger: 3, energy: 3, sleep: 3, training: 3, mood: 3 }));
  renderApp(repos, today);
  await openDashboardHistory();
  await screen.findByText('How you are holding up', { selector: '.mm-section-title' });
  expect(screen.queryByText(/^Recovery observations:/)).not.toBeInTheDocument();
});
