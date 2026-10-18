import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InsightSwitches } from '../../src/domain/InsightSwitches';
import { Pause } from '../../src/domain/Pause';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { finishedWorkout, layer, openTrain, set, workoutRows } from '../support/train';

/**
 * MM-362, MM-363, MM-364, MM-366: the coach's line under a lift, worked out
 * from what was logged, listed on the Coach tab once shown, and quieted in
 * Settings > Coach.
 */
const today = CalendarDate.of(2026, 10, 16);
const line = /^14 sets for chest in the 7 days to this workout\. Your usual is about 9 a week\./;
let repos: InMemoryRepositories;

const benchSets = (n: number) => Array.from({ length: n }, () => set(8, 60));

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  await repos.weights.saveWeight(today, 82);
  // Nine chest sets a week for four weeks, then fourteen yesterday.
  for (const daysAgo of [8, 15, 22, 29]) {
    await repos.workouts.saveWorkout(finishedWorkout(today, daysAgo, [['barbell-bench-press', benchSets(9)]]));
  }
  await repos.workouts.saveWorkout(finishedWorkout(today, 1, [['barbell-bench-press', benchSets(14)]]));
});

async function openLatestWorkout(): Promise<void> {
  renderApp(repos, today);
  await openTrain();
  await userEvent.click(workoutRows()[0] as HTMLElement);
}

it('says under the lift what the coach noticed, with the numbers behind it one tap down', async () => {
  await openLatestWorkout();
  const insight = await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ });
  expect(layer().getByText(line)).toBeInTheDocument();
  await userEvent.click(insight);
  expect(layer().getByText('The numbers behind this')).toBeInTheDocument();
  expect(layer().getByText('Usual week, the 4 weeks before')).toBeInTheDocument();
  expect(layer().getByText('About 9')).toBeInTheDocument();
});

it('once shown, the Coach tab lists it under Training, and it leads back to the workout', async () => {
  await openLatestWorkout();
  await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ });
  await expect.poll(async () => (await first(repos.inlineInsightLog.watchInlineInsightLog({ since: today.addDays(-13) }))).length).toBe(1);
  cleanup();

  renderApp(repos, today);
  await openTab('Coach');
  await userEvent.click(await screen.findByRole('button', { name: /^Recent insights/ }, { timeout: 10000 }));
  const row = await layer().findByRole('button', { name: /^Barbell bench press/ });
  expect(row).toHaveTextContent('14 sets for chest');
  await userEvent.click(row);
  expect(await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ })).toBeInTheDocument();
});

it('"Settings for “Volume jump”" opens training’s kinds with that one named and its switch focused', async () => {
  await openLatestWorkout();
  await userEvent.click(await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ }));
  await userEvent.click(layer().getByRole('button', { name: 'Settings for “Volume jump”' }));
  expect(await layer().findByText(/^The insight you opened is this kind/)).toBeInTheDocument();
  expect(document.activeElement).toBe(layer().getByRole('switch', { name: /^Volume jump/ }));
});

it('training switched off in Settings > Coach hides the line, and stays off after the app is opened again', async () => {
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('button', { name: /^Coaching insights/ }));
  await userEvent.click(await layer().findByRole('button', { name: /^Training/ }));
  await userEvent.click(await layer().findByRole('switch', { name: /^Training insights/ }));
  await expect.poll(async () => [...(await first(repos.preferences.watchInsightSwitches())).offAreas]).toEqual(['training']);
  cleanup();

  await openLatestWorkout();
  await layer().findByRole('heading', { name: 'Barbell bench press' });
  expect(layer().queryByRole('button', { name: /^Coach:/ })).toBeNull();
});

it('all insights off: the areas say so and keep their own positions', async () => {
  await repos.preferences.saveInsightSwitches(InsightSwitches.withArea(InsightSwitches.allOn, 'training', false));
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('button', { name: /^Coaching insights/ }));
  await userEvent.click(await layer().findByRole('switch', { name: /^Insights under logged items/ }));
  expect(await layer().findAllByText('Off while insights are off')).toHaveLength(4);
  await userEvent.click(layer().getByRole('switch', { name: /^Insights under logged items/ }));
  // Back on, training is still off as it was.
  expect(await layer().findByText('Off')).toBeInTheDocument();
});

it('while coaching is paused, no line shows', async () => {
  await repos.pauses.savePause(new Pause({ from: today.addDays(-1), to: today.addDays(6), reason: 'travel' }));
  await openLatestWorkout();
  await layer().findByRole('heading', { name: 'Barbell bench press' });
  expect(layer().queryByRole('button', { name: /^Coach:/ })).toBeNull();
});

it('"Snooze…" quiets that kind on that lift for the length chosen, with Undo (MM-378)', async () => {
  await openLatestWorkout();
  await userEvent.click(await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ }));
  await userEvent.click(layer().getByRole('button', { name: /^Snooze… Volume jump for Barbell bench press/ }));
  const dialog = await screen.findByRole('dialog', { name: /^Snooze “Volume jump” for Barbell bench press/ });
  await userEvent.click(within(dialog).getByRole('option', { name: /^For a week/ }));
  await expect.poll(() => layer().queryByRole('button', { name: /^Coach:/ })).toBeNull();
  const snoozed = await first(repos.insightSnoozes.watchInsightSnoozes());
  expect(snoozed.map((s) => [s.kind, s.subject, s.resumesOn?.epochDay])).toEqual([['volumeJump', 'barbell-bench-press', today.addDays(8).epochDay]]);
  expect(screen.getByText(/^Snoozed for Barbell bench press until /)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ })).toBeInTheDocument();
});

it('a snoozed kind is listed in its area in Settings > Coach, and "Turn back on" brings it back (MM-378)', async () => {
  await repos.insightSnoozes.saveInsightSnooze({ kind: 'volumeJump', subject: 'barbell-bench-press', item: 'Barbell bench press', resumesOn: undefined });
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('button', { name: /^Coaching insights/ }));
  await userEvent.click(await layer().findByRole('button', { name: /^Training/ }));
  expect(await layer().findByText('Barbell bench press · until turned back on')).toBeInTheDocument();
  await userEvent.click(layer().getByRole('button', { name: /^Turn back on Volume jump for Barbell bench press/ }));
  await expect.poll(async () => (await first(repos.insightSnoozes.watchInsightSnoozes())).length).toBe(0);
  expect(layer().queryByText('Snoozed')).toBeNull();
});

it('a snooze that has run out no longer quiets the line (MM-378)', async () => {
  await repos.insightSnoozes.saveInsightSnooze({ kind: 'volumeJump', subject: 'barbell-bench-press', item: 'Barbell bench press', resumesOn: today });
  await openLatestWorkout();
  expect(await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ })).toBeInTheDocument();
});

it('the Coach tab does not list a snoozed insight while it is quiet (MM-378)', async () => {
  await openLatestWorkout();
  await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ });
  await expect.poll(async () => (await first(repos.inlineInsightLog.watchInlineInsightLog({ since: today.addDays(-13) }))).length).toBe(1);
  await repos.insightSnoozes.saveInsightSnooze({ kind: 'volumeJump', subject: 'barbell-bench-press', item: 'Barbell bench press', resumesOn: today.addDays(8) });
  cleanup();
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText('None in the last 14 days', {}, { timeout: 10000 })).toBeInTheDocument();
});


it('the focus stays on the screen when a snoozed line goes, and when a snooze is turned back on (MM-379)', async () => {
  await openLatestWorkout();
  await userEvent.click(await layer().findByRole('button', { name: /^Coach: 14 sets for chest/ }));
  await userEvent.click(layer().getByRole('button', { name: /^Snooze… Volume jump/ }));
  const dialog = await screen.findByRole('dialog', { name: /^Snooze “Volume jump”/ });
  await userEvent.click(within(dialog).getByRole('option', { name: /^For a week/ }));
  await expect.poll(() => layer().queryByRole('button', { name: /^Coach:/ })).toBeNull();
  const card = layer().getByRole('heading', { name: 'Barbell bench press' }).closest('.mm-surface');
  expect(document.activeElement).not.toBe(document.body);
  expect(card?.contains(document.activeElement)).toBe(true);
  cleanup();

  await repos.insightSnoozes.saveInsightSnooze({ kind: 'volumeJump', subject: 'barbell-bench-press', item: 'Barbell bench press', resumesOn: undefined });
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('button', { name: /^Coaching insights/ }));
  await userEvent.click(await layer().findByRole('button', { name: /^Training/ }));
  await userEvent.click(await layer().findByRole('button', { name: /^Turn back on Volume jump/ }));
  await expect.poll(() => layer().queryByText('Snoozed')).toBeNull();
  expect(document.activeElement).not.toBe(document.body);
  expect(layer().getByRole('heading', { name: 'Training insights' }).closest('.app-screen, body')?.contains(document.activeElement)).toBe(true);
});
