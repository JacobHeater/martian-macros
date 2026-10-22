import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { HealthConnectSegment } from '../../src/domain/training/HealthConnectSegment';
import type { PlatformWorkout } from '../../src/domain/training/PlatformWorkout';
import { InMemoryHealthWorkouts } from '../../src/fixtures/InMemoryHealthWorkouts';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { renderApp } from '../support/renderApp';
import { exerciseCard, layer, openTrain, storedWorkouts, workoutRows } from '../support/train';

/** MM-490: workouts from the health platform, in the app's log. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  await repos.weights.saveWeight(today, 82);
});

const yesterday = (minute: number) => new Date(2026, 9, 4, 18, minute);

/** A strength session on a watch yesterday: a punch the library cannot place, then two bench press sets. */
const fromWatch: PlatformWorkout = {
  platformId: 'hc-1',
  clientId: undefined,
  strength: true,
  start: yesterday(0),
  end: yesterday(45),
  segments: [
    { segmentId: HealthConnectSegment.platformId('punch'), start: yesterday(5), end: yesterday(7), repetitions: undefined, weightKg: undefined },
    { segmentId: HealthConnectSegment.platformId('benchPress'), start: yesterday(10), end: yesterday(11), repetitions: 8, weightKg: undefined },
  ],
  sourceId: 'com.example.watch',
  sourceName: 'Watch',
};

const withPlatform =
  (platform: InMemoryHealthWorkouts) =>
  (services: AppServices): AppServices => ({ ...services, healthWorkouts: platform });

it('An imported workout is not imported twice: opened again, the log still has one workout for it', async () => {
  const platform = new InMemoryHealthWorkouts({ namesExercises: true, held: [fromWatch] });
  renderApp(repos, today, { change: withPlatform(platform) });
  await openTrain();
  await expect.poll(async () => (await storedWorkouts(repos)).length).toBe(1);
  expect(await screen.findByText(/from Watch$/)).toBeInTheDocument();
  cleanup();

  renderApp(repos, today, { change: withPlatform(platform) });
  await openTrain();
  await screen.findByText(/from Watch$/);
  const stored = await storedWorkouts(repos);
  expect(stored).toHaveLength(1);
  expect(stored[0]?.imported).toEqual({ platformId: 'hc-1', sourceName: 'Watch' });
  expect(workoutRows()).toHaveLength(1);
});

it('one deleted in the app is not brought back by the next read', async () => {
  renderApp(repos, today, { change: withPlatform(new InMemoryHealthWorkouts({ namesExercises: true, held: [fromWatch] })) });
  await openTrain();
  await expect.poll(async () => (await storedWorkouts(repos)).length).toBe(1);
  const [imported] = await storedWorkouts(repos);
  await repos.workouts.deleteWorkout(imported?.id ?? 0);
  cleanup();

  // Read again, with a second workout on the platform since: that one comes in, the deleted one does not.
  const later = { ...fromWatch, platformId: 'hc-2', start: new Date(2026, 9, 5, 7, 0), end: new Date(2026, 9, 5, 7, 30), segments: [] };
  renderApp(repos, today, { change: withPlatform(new InMemoryHealthWorkouts({ namesExercises: true, held: [fromWatch, later] })) });
  await openTrain();
  await expect.poll(async () => (await storedWorkouts(repos)).map((w) => w.imported?.platformId)).toEqual(['hc-2']);
});

it('Other exercise: shown by name with its time, and its sets moved to an exercise the user chooses', async () => {
  const platform = new InMemoryHealthWorkouts({ namesExercises: true, held: [fromWatch] });
  renderApp(repos, today, { change: withPlatform(platform) });
  await openTrain();
  await screen.findByText(/from Watch$/);
  await userEvent.click(workoutRows()[0] as HTMLElement);
  const other = await layer().findByRole('heading', { name: 'Other exercise' });
  const card = other.closest('.mm-surface') as HTMLElement;
  expect(within(card).getByText(/· 2:00$/)).toBeInTheDocument();
  await userEvent.click(within(card).getByRole('button', { name: 'Move sets to an exercise' }));
  await layer().findByRole('textbox', { name: 'Search exercises' });
  await userEvent.type(layer().getByRole('textbox', { name: 'Search exercises' }), 'deadlift');
  await userEvent.click(layer().getAllByRole('button', { name: /^Deadlift/ })[0] as HTMLElement);
  await layer().findByRole('heading', { name: /^Deadlift/ });
  expect(layer().queryByRole('heading', { name: 'Other exercise' })).not.toBeInTheDocument();
  const [moved] = await storedWorkouts(repos);
  expect(moved?.exercises[0]?.exerciseId).not.toBe('other-exercise');
  expect(moved?.exercises[0]?.sets[0]?.startedAt).toEqual(yesterday(5));
  expect(exerciseCard('Barbell bench press')).toBeInTheDocument();
});

it('with reading workouts not allowed, nothing is imported', async () => {
  const platform = new InMemoryHealthWorkouts({ namesExercises: true, held: [fromWatch], readPermitted: false });
  renderApp(repos, today, { change: withPlatform(platform) });
  await openTrain();
  expect(await screen.findByRole('button', { name: 'Start workout' })).toBeInTheDocument();
  expect(await storedWorkouts(repos)).toEqual([]);
});
