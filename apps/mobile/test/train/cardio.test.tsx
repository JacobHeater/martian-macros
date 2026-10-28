import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { PlatformWorkout } from '../../src/domain/training/PlatformWorkout';
import { InMemoryHealthWorkouts } from '../../src/fixtures/InMemoryHealthWorkouts';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import type { AppServices } from '../../src/state/AppServices';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';
import { finishedWorkout, openTrain, set } from '../support/train';

/**
 * MM-677 (the owner, 2026-10-28): cardio from the wearable, sessions and steps, kept in the app from the platform's
 * own records and drawn on Train as a fold in place (MM-680); the app times and types nothing.
 */
const today = CalendarDate.of(2026, 10, 5);
const minuteMs = 60 * 1000;
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }));
  await repos.weights.saveWeight(today, 82);
});

const at = (daysAgo: number, hour: number, minute = 0) => new Date(2026, 9, 5 - daysAgo, hour, minute);

/** A session on the platform `daysAgo`, as the plugin names its activity. */
const session = (platformId: string, daysAgo: number, minutes: number, over: Partial<PlatformWorkout> = {}): PlatformWorkout => ({
  platformId,
  clientId: undefined,
  strength: false,
  cardio: 'walking',
  start: at(daysAgo, 7, 5),
  end: new Date(at(daysAgo, 7, 5).getTime() + minutes * minuteMs),
  segments: [],
  sourceId: 'com.example.watch',
  sourceName: 'Watch',
  ...over,
});

/** The platform with 8,400 steps on each of the last seven days from the watch, steps allowed. */
async function stepsSource(perDay = 8400): Promise<FakeHealthSource> {
  const events = Array.from({ length: 7 }, (_, daysAgo) => {
    const day = today.addDays(-daysAgo).toString();
    return { op: 'add', type: 'steps', id: `steps-${daysAgo}`, value: perDay, start: `${day}T08:00:00`, end: `${day}T20:00:00`, source: 'watch' };
  });
  const source = FakeHealthSource.fromJson(JSON.stringify({ sources: [{ id: 'watch', name: 'Watch' }], events }));
  await source.permit(new Set(['steps', 'workout']));
  return source;
}

const wearing =
  (platform: InMemoryHealthWorkouts, source?: FakeHealthSource) =>
  (services: AppServices): AppServices => ({ ...services, healthWorkouts: platform, ...(source === undefined ? {} : { healthSource: source }) });

const cardioHeader = () => screen.findByRole('button', { name: 'Cardio' });
/** The Cardio fold, header and body. */
const cardioFold = async () => (await cardioHeader()).closest('.mm-section') as HTMLElement;
const storedSessions = () => first(repos.cardioSessions.watchCardioSessions());

it('a walk on the watch and the steps show on Train, are kept, and the fold draws the week in place', async () => {
  const platform = new InMemoryHealthWorkouts({ namesExercises: false, held: [session('hk-walk', 1, 42)] });
  renderApp(repos, today, { change: wearing(platform, await stepsSource()) });
  await openTrain();
  const fold = await cardioFold();
  await expect.poll(() => fold.textContent).toContain('About 8,400 steps a day · 42 min of cardio this week');
  // Kept from the platform's own records (MM-71): one row for the walk, a row a day for the steps.
  const kept = await storedSessions();
  expect(kept.map((s) => [s.platformId, s.activity, s.minutes, s.sourceName])).toEqual([['hk-walk', 'walking', 42, 'Watch']]);
  expect((await first(repos.dailySteps.watchDailySteps())).map((d) => d.steps)).toEqual([8400, 8400, 8400, 8400, 8400, 8400, 8400]);
  // The strip: yesterday's dot half, "cardio only".
  const strip = screen.getByRole('group', { name: 'Last seven days of training' });
  expect(within(strip).getByRole('img', { name: 'Yesterday: cardio only' })).toBeInTheDocument();
  expect(within(strip).getByRole('img', { name: 'Today: no workout' })).toBeInTheDocument();

  // Opened in place (MM-680): the figures, the steps by day, the minutes by activity, and the sessions one tap down. No screen.
  await userEvent.click(await cardioHeader());
  expect(within(fold).getByText('8,400')).toBeInTheDocument();
  expect(within(fold).getByText('steps a day · floor 8,000 · none counted last week')).toBeInTheDocument();
  expect(within(fold).getByText('42 min')).toBeInTheDocument();
  expect(within(fold).getByText('of cardio · floor 2 h 30 min · 0 min last week')).toBeInTheDocument();
  expect(within(fold).getByRole('img', { name: 'Steps by day, last seven days: 7 of 7 counted, from 8,400 to 8,400. Floor 8,000 a day.' })).toBeInTheDocument();
  expect(within(fold).getByRole('img', { name: 'Walking: 42 min this week; 0 min last week. Floor 2 h 30 min a week.' })).toBeInTheDocument();
  await userEvent.click(within(fold).getByRole('button', { name: 'Sessions this week' }));
  expect(within(fold).getByText('Walking · 42 min')).toBeInTheDocument();
  expect(within(fold).getByText('Yesterday · 7:05 AM · from Watch')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { level: 1, name: 'Cardio' })).not.toBeInTheDocument();
});

it('read again, the session is kept once; a strength session is a workout, not cardio; every other session counts', async () => {
  const lift = session('hc-lift', 2, 50, { strength: true, cardio: undefined });
  const hiit = session('hc-hiit', 3, 20, { cardio: 'intervals' });
  const platform = new InMemoryHealthWorkouts({ namesExercises: true, held: [session('hk-walk', 1, 42), lift, hiit] });
  renderApp(repos, today, { change: wearing(platform) });
  await openTrain();
  await expect.poll(async () => (await storedSessions()).length).toBe(2);
  expect((await storedSessions()).map((s) => [s.platformId, s.activity])).toEqual([
    ['hk-walk', 'walking'],
    ['hc-hiit', 'intervals'],
  ]);
  expect((await first(repos.workouts.watchWorkouts())).map((w) => w.imported?.platformId)).toEqual(['hc-lift']);
  // The strip: the lift's day full, the walk's and the HIIT's half.
  const strip = screen.getByRole('group', { name: 'Last seven days of training' });
  expect(within(strip).getByRole('img', { name: /: trained$/ })).toBeInTheDocument();
  expect(within(strip).getAllByRole('img', { name: /: cardio only$/ })).toHaveLength(2);
  // Both activities drawn as bars, most minutes first.
  await userEvent.click(await cardioHeader());
  const bars = screen.getAllByRole('img', { name: /this week; .* last week\. Floor/ });
  expect(bars.map((bar) => bar.getAttribute('aria-label')?.split(':')[0])).toEqual(['Walking', 'Intervals']);
  cleanup();
  // The second read, in a new session of the app, adds nothing.
  renderApp(repos, today, { change: wearing(platform) });
  await openTrain();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(await storedSessions()).toHaveLength(2);
});

it('a day with a strength workout is full on the strip whatever the watch recorded', async () => {
  await repos.workouts.saveWorkout(finishedWorkout(today, 1, [['back-squat', [set(5, 100)]]]));
  const platform = new InMemoryHealthWorkouts({ namesExercises: false, held: [session('hk-walk', 1, 42)] });
  renderApp(repos, today, { change: wearing(platform) });
  await openTrain();
  await expect.poll(async () => (await storedSessions()).length).toBe(1);
  const strip = screen.getByRole('group', { name: 'Last seven days of training' });
  expect(within(strip).getByRole('img', { name: 'Yesterday: trained' })).toBeInTheDocument();
});

it('without a health platform the fold is drawn and says what would bring it, its week empty', async () => {
  renderApp(repos, today);
  await openTrain();
  const fold = await cardioFold();
  expect(fold).toHaveTextContent('Comes from a watch or phone through Health Connect, which this phone does not have.');
  await userEvent.click(await cardioHeader());
  expect(within(fold).getByText('no steps counted · floor 8,000 · none counted last week')).toBeInTheDocument();
  expect(within(fold).getByText('0 min')).toBeInTheDocument();
  expect(within(fold).getByRole('img', { name: 'Steps by day, last seven days: none counted. Floor 8,000 a day.' })).toBeInTheDocument();
  expect(within(fold).getByText('No sessions on the watch in the last seven days.')).toBeInTheDocument();
});

it('with the platform there but steps and sessions not allowed, the fold says which to allow', async () => {
  const source = await stepsSource();
  source.revoke(new Set(['steps', 'workout']));
  renderApp(repos, today, { change: wearing(new InMemoryHealthWorkouts({ namesExercises: true, readPermitted: false }), source) });
  await openTrain();
  const fold = await cardioFold();
  await expect.poll(() => fold.textContent).toContain('Allow Steps and Exercise sessions in Settings › Health to see it here.');
});
