import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { builtInExercises } from '../../src/domain/training/builtInExercises';
import type { Exercise } from '../../src/domain/training/Exercise';
import type { Workout } from '../../src/domain/training/Workout';
import type { UnitSystem } from '../../src/domain/UnitSystem';
import type { WeightObservation } from '../../src/domain/WeightObservation';
import { DemoSeed } from '../../src/fixtures/DemoSeed';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { ArgumentError } from '../../src/lang/ArgumentError';
import type { AppServices } from '../../src/state/AppServices';
import { AppState } from '../../src/state/AppState';
import { failsFirst } from '../support/failsFirst';
import { first } from '../support/first';
import { never } from '../support/never';
import { openTab } from '../support/openTab';
import { overriding } from '../support/overriding';
import { renderApp } from '../support/renderApp';
import { servicesOf } from '../support/servicesOf';
import { topLayer } from '../support/topLayer';
import { workoutOn } from '../support/workoutOn';

/** Strength trends on Progress and a lift's history. Carried over from strength_progress_test.dart. */
const today = CalendarDate.of(2026, 10, 11);
const bench = 'barbell-bench-press';

const workout = ({ load = 100, daysAgo = 0, exerciseId = bench }: { load?: number; daysAgo?: number; exerciseId?: string } = {}) =>
  workoutOn(today.addDays(-daysAgo), [[exerciseId, 6, load]]);

async function fresh(units: UnitSystem = 'metric'): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-300), healthCheckConfirmedOn: today }).copyWith({ unitSystem: units }),
  );
  return repos;
}

async function open(repos: InMemoryRepositories, change?: (services: AppServices) => AppServices): Promise<void> {
  renderApp(repos, today, change === undefined ? {} : { change });
  await openTab('Progress');
  await screen.findByRole('heading', { name: 'Strength trends' });
}

const cards = () => [...document.querySelectorAll('.app-layer:not([hidden]) .mm-card-figure')];

it('MM-192: a set that cannot be worked out is a failure, not a trend', async () => {
  const repos = new InMemoryRepositories();
  const services = servicesOf(repos, new FixedClock(today));
  const state = new AppState({
    ...services,
    workouts: overriding(services.workouts, {
      watchWorkouts: () => ({
        subscribe(listener) {
          listener([workout({ load: Number.NaN })]);
          return () => undefined;
        },
      }),
    }),
  });
  const stop = state.strengthTrends.subscribe(() => undefined);
  await first(repos.weights.watchWeights());
  const trends = state.strengthTrends.peek();
  stop();
  expect(trends.ready).toBe(false);
  expect('error' in trends && trends.error).toBeInstanceOf(ArgumentError);
});

it('loading, read failure and retry are explicit', async () => {
  const repos = await fresh();
  const read = failsFirst<Workout[]>([workout()]);
  await open(repos, (services) => ({
    ...services,
    workouts: overriding(services.workouts, { watchWorkouts: read.watch }),
  }));
  expect(screen.queryByText(/Finish a workout/)).not.toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: 'Retry strength history' }));
  expect(await screen.findByText('120.0 kg')).toBeInTheDocument();
  expect(read.attempts()).toBe(2);
});

it('while the workouts are being read nothing is claimed', async () => {
  const repos = await fresh();
  await open(repos, (services) => ({
    ...services,
    workouts: overriding(services.workouts, { watchWorkouts: () => never<Workout[]>() }),
  }));
  expect(screen.queryByText(/Finish a workout/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry strength history' })).not.toBeInTheDocument();
  expect(cards()).toHaveLength(0);
});

it('imperial presentation converts estimates and deltas', async () => {
  const repos = await fresh('imperial');
  await repos.workouts.saveWorkout(workout({ load: 100, daysAgo: 28 }));
  await repos.workouts.saveWorkout(workout({ load: 110 }));
  await open(repos);
  expect(await screen.findByText('277.8 lb')).toBeInTheDocument();
  expect(screen.getByText('4 weeks: +13.2 lb')).toBeInTheDocument();
  expect(screen.getByText('12 weeks: Not enough history')).toBeInTheDocument();
});

for (const exerciseRead of [false, true]) {
  it(`${exerciseRead ? 'exercise' : 'weight'} read failure and retry`, async () => {
    const repos = await fresh();
    await repos.workouts.saveWorkout(workout());
    const exercises = failsFirst<Exercise[]>([]);
    const weights = failsFirst<WeightObservation[]>([]);
    await open(repos, (services) =>
      exerciseRead
        ? {
            ...services,
            customExercises: overriding(services.customExercises, { watchCustomExercises: exercises.watch }),
          }
        : { ...services, weights: overriding(services.weights, { watchWeights: weights.watch }) },
    );
    expect(cards()).toHaveLength(0);
    await userEvent.click(await screen.findByRole('button', { name: 'Retry strength history' }));
    expect(await screen.findByText('120.0 kg')).toBeInTheDocument();
    expect((exerciseRead ? exercises : weights).attempts()).toBe(2);
  });
}

it('MM-194: deleting a custom exercise retains its lift history', async () => {
  const repos = await fresh();
  const id = await repos.customExercises.saveCustomExercise((builtInExercises[0] as Exercise).withId(''));
  await repos.workouts.saveWorkout(workout({ exerciseId: id }));
  await open(repos);
  await expect.poll(() => cards().length).toBe(1);
  await repos.customExercises.deleteCustomExercise(id);
  await expect.poll(() => cards().length).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'All lift histories' }));
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(`^Deleted exercise \\(${id}\\)`) }));
  expect(await within(topLayer()).findByText(/Exercise details were deleted/)).toBeInTheDocument();
  const saved = await first(repos.workouts.watchWorkouts());
  expect(saved[0]?.exercises[0]?.sets[0]?.loadKg).toBe(100);
});

it('the detail chart includes older history', async () => {
  const repos = await fresh();
  await repos.workouts.saveWorkout(workout({ daysAgo: 200 }));
  await open(repos);
  await userEvent.click(screen.getByRole('button', { name: 'All lift histories' }));
  await userEvent.click(await screen.findByRole('button', { name: /^Barbell bench press/ }));
  const chart = await within(topLayer()).findByRole('img', { name: /history, / });
  // 201 days: from the first session to today.
  expect(chart).toHaveAccessibleName(/^kg history, Mar 25 to Oct 11\./);
  expect(within(topLayer()).queryByText(/No records in this range/)).not.toBeInTheDocument();
});

it('empty data is honest and a new workout appears as it is saved', async () => {
  const repos = await fresh();
  await open(repos);
  expect(screen.getByText('Finish a workout in Train to start your strength history.')).toBeInTheDocument();
  const id = await repos.workouts.saveWorkout(workout());
  expect(await screen.findByText('120.0 kg')).toBeInTheDocument();
  expect(cards()).toHaveLength(1);
  await repos.workouts.saveWorkout(workout({ load: 80 }).copyWith({ id }));
  expect(await screen.findByText('96.0 kg')).toBeInTheDocument();
  await repos.workouts.deleteWorkout(id);
  await expect.poll(() => cards().length).toBe(0);
});

it('all histories include unusable lifts and same-day sessions', async () => {
  const repos = await fresh();
  await repos.workouts.saveWorkout(workout());
  await repos.workouts.saveWorkout(workout({ load: 110 }));
  await repos.workouts.saveWorkout(workout({ exerciseId: 'pull-up', load: 0 }));
  await open(repos);
  await userEvent.click(screen.getByRole('button', { name: 'All lift histories' }));
  await userEvent.click(await screen.findByRole('button', { name: /^Pull-up/ }));
  expect(await within(topLayer()).findByText(/No usable estimate yet/)).toBeInTheDocument();
  expect(within(topLayer()).getByText(/Uses total bodyweight/)).toBeInTheDocument();
  await userEvent.click(within(topLayer()).getByRole('button', { name: 'Back' }));
  await userEvent.click(await within(topLayer()).findByRole('button', { name: /^Barbell bench press/ }));
  const sessions = (await within(topLayer()).findByRole('heading', { name: 'Qualifying sessions' })).closest(
    '.mm-surface',
  ) as HTMLElement;
  expect(sessions.querySelectorAll('.mm-list-row')).toHaveLength(2);
});

it('the four most-trained lifts each get a card with its comparisons', async () => {
  const repos = new InMemoryRepositories();
  await new DemoSeed(today).replace(repos);
  await repos.preferences.saveThemePreference('martian');
  await open(repos);
  await expect.poll(() => cards().length).toBe(4);
  expect(screen.getAllByText(/^12 weeks: \+/).length).toBeGreaterThan(0);
});

it('a corrected weigh-in recomputes bodyweight strength', async () => {
  const repos = await fresh();
  await repos.workouts.saveWorkout(workout({ exerciseId: 'pull-up', load: 0 }));
  await repos.weights.saveWeight(today, 80);
  await open(repos);
  expect(await screen.findByText('96.0 kg')).toBeInTheDocument();
  await repos.weights.saveWeight(today, 90);
  expect(await screen.findByText('108.0 kg')).toBeInTheDocument();
});
