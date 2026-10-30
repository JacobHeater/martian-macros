import { screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CardioSession } from '../../src/domain/training/CardioSession';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { finishedWorkout, set } from '../support/train';

/**
 * MM-681 (the owner): the coach holds the person to lifting, cardio and steps where the Coach tab opens: the
 * Executive summary's words and rows, and the day's findings, in the deterministic words (the model's request carries
 * the same figures: `test/format/narrationFigures.test.ts`).
 */
const today = CalendarDate.of(2026, 10, 5);
const minuteMs = 60 * 1000;
let repos: InMemoryRepositories;

const session = (daysAgo: number, minutes: number) => {
  const date = today.addDays(-daysAgo);
  const start = new Date(date.year, date.month - 1, date.day, 7, 5);
  return new CardioSession({ platformId: `walk-${daysAgo}`, sourceName: 'Watch', activity: 'walking', start, end: new Date(start.getTime() + minutes * minuteMs) });
};

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  // Three training days a week set, on fat loss, 40 days in.
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-30), { mode: 'fatLoss', weeklyRateFraction: -0.0075, proteinMinimumG: 130 }));
  for (let i = 0; i < 14; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.05);
  await repos.workouts.saveWorkout(finishedWorkout(today, 2, [['back-squat', [set(5, 100)]]]));
  await repos.cardioSessions.saveCardioSessions([session(1, 30), session(3, 36), session(6, 30), session(9, 60)]);
  await repos.dailySteps.saveDailySteps(Array.from({ length: 7 }, (_, i) => ({ date: today.addDays(-i), steps: 6100 })));
});

const summary = async () => (await screen.findByRole('heading', { name: 'Executive summary' })).closest('.mm-section') as HTMLElement;

it('the Executive summary holds the person to the sessions set, the cardio floor and the steps floor', async () => {
  renderApp(repos, today);
  await openCoach();
  const card = await summary();
  // One training line, lifting first (MM-713); the cardio and steps stand in the rows under the words.
  await expect.poll(() => card.textContent).toContain('One of the three lifts you set is in: two to go this week.');
  expect(card.textContent).not.toContain('Cardio 1 h 36 min against');
  expect(within(card).getByText('Lifting this week')).toBeInTheDocument();
  expect(within(card).getByText('1 / 3 sessions')).toBeInTheDocument();
  expect(within(card).getByText('Last session 2 days ago')).toBeInTheDocument();
  expect(within(card).getByText('Cardio this week')).toBeInTheDocument();
  expect(within(card).getByText('1 h 36 min')).toBeInTheDocument();
  expect(within(card).getByText('Steps a day')).toBeInTheDocument();
  expect(within(card).getByText('About 6,100')).toBeInTheDocument();
});

it("the day's findings hold the person to cardio and steps where the tab opens, on 1d", async () => {
  renderApp(repos, today);
  await openCoach();
  expect(await screen.findByText('1 h 36 min of cardio this week')).toBeInTheDocument();
  expect(await screen.findByText('About 6,100 steps a day')).toBeInTheDocument();
});

it('without a watch on a cut the summary says nothing is being counted; on maintenance it holds lifting only', async () => {
  await repos.eraser.eraseAll();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-30), { mode: 'fatLoss', weeklyRateFraction: -0.0075, proteinMinimumG: 130 }));
  await repos.weights.saveWeight(today, 82);
  const { unmount } = renderApp(repos, today);
  await openCoach();
  let card = await summary();
  // Lifting behind is the one line (MM-713); the row under it says no watch is connected.
  await expect.poll(() => card.textContent).toContain('Zero lifts of the three you set this week: book one tonight.');
  expect(within(card).getByText('No watch connected')).toBeInTheDocument();
  unmount();

  await repos.setup.saveSetup(typicalSetup({ goalMode: 'maintenance', onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-30), { mode: 'maintenance', weeklyRateFraction: 0, proteinMinimumG: 130 }));
  renderApp(repos, today);
  await openCoach();
  card = await summary();
  await expect.poll(() => card.textContent).toContain('Zero lifts of the three you set this week: book one tonight.');
  expect(card.textContent).not.toContain('watch');
  expect(within(card).queryByText('Cardio and steps')).not.toBeInTheDocument();
});
