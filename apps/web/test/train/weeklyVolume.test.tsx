import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { builtInExercises } from '../../src/domain/training/builtInExercises';
import { Exercise } from '../../src/domain/training/Exercise';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { MuscleVolume } from '../../src/engine/MuscleVolume';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { AppServices } from '../../src/state/AppServices';
import { MuscleVolumeRow } from '../../src/ui/MuscleVolumeRow';
import { failsFirst } from '../support/failsFirst';
import { overriding } from '../support/overriding';
import { renderApp } from '../support/renderApp';
import { layer, openTrain } from '../support/train';

/** Hard sets by muscle group, this week beside last. Carried over from weekly_volume_test.dart. */
const today = CalendarDate.of(2026, 10, 11);
const bench = 'barbell-bench-press';

function workout({ age = 0, count = 4, id = bench }: { age?: number; count?: number; id?: string } = {}): Workout {
  const date = today.addDays(-age);
  const start = new Date(date.year, date.month - 1, date.day);
  return new Workout({
    id: 0,
    date,
    startedAt: start,
    endedAt: new Date(start.getTime() + 3600000),
    exercises: [
      new WorkoutExercise({
        exerciseId: id,
        sets: Array.from({ length: count }, () => new WorkoutSet({ reps: 10, loadKg: 100 })),
      }),
    ],
  });
}

async function fresh(): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  return repos;
}

async function openVolume(repos: InMemoryRepositories, change?: (services: AppServices) => AppServices): Promise<void> {
  renderApp(repos, today, change === undefined ? {} : { change });
  await openTrain();
  await userEvent.click(screen.getByRole('button', { name: 'Weekly training volume' }));
  await layer().findByRole('heading', { name: 'Weekly training volume' });
}

const row = (group: string) => layer().getByRole('img', { name: new RegExp(`^${group}: `) }).closest('.mm-volume-row');

it('all groups, exact half sets, zero and reactive edit and delete', async () => {
  const repos = await fresh();
  const id = await repos.workouts.saveWorkout(workout({ count: 3 }));
  await repos.workouts.saveWorkout(workout({ age: 7, count: 4 }));
  await openVolume(repos);
  await layer().findByRole('heading', { name: 'Hard sets by muscle group' });
  expect(row('Chest')).toHaveTextContent('3 hard sets');
  expect(row('Chest')).toHaveTextContent('Previous: 4 · change: -1');

  await repos.workouts.saveWorkout(workout({ count: 30 }).copyWith({ id }));
  await expect.poll(() => row('Chest')?.textContent ?? '').toContain('30 hard sets');
  await repos.workouts.deleteWorkout(id);
  await expect.poll(() => row('Chest')?.textContent ?? '').toContain('Previous: 4 · change: -4');
  expect(row('Hamstrings')).toHaveTextContent('0 hard sets');
});

it('MM-195: the volume can be reached during a workout', async () => {
  const repos = await fresh();
  await repos.workouts.saveWorkout(workout().copyWith({ endedAt: undefined }));
  renderApp(repos, today);
  await openTrain();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Weekly training volume' }));
  expect(await layer().findByRole('heading', { name: 'Last seven days' })).toBeInTheDocument();
});

it('sets of an exercise that is not known are said to be left out', async () => {
  const repos = await fresh();
  await repos.workouts.saveWorkout(workout({ id: 'custom-deleted' }));
  await openVolume(repos);
  expect(await layer().findByText(/4 current and 0 previous hard sets omitted/)).toBeInTheDocument();
});

it('the reference band and a volume above the range are drawn to scale', () => {
  render(<MuscleVolumeRow volume={new MuscleVolume({ group: 'chest', currentSets: 30, previousSets: 15 })} />);
  const bar = screen.getByRole('img', { name: /Chest: 30 current hard sets; 15 previous/ });
  const style = (name: string) => bar.querySelector<HTMLElement>(`.mm-volume-${name}`)?.style;
  // Thirty sets is the whole bar, so ten is a third of it.
  expect(style('reference')?.left).toBe('33.33333333333333%');
  expect(style('reference')?.width).toBe('33.33333333333333%');
  expect(style('current')?.width).toBe('100%');
});

it('a change to an exercise of the user’s own moves its volume at once', async () => {
  const repos = await fresh();
  const source = builtInExercises[0] as Exercise;
  const id = await repos.customExercises.saveCustomExercise(
    new Exercise({ id: '', name: 'Custom lift', equipment: source.equipment, primary: 'chest', secondary: ['triceps'] }),
  );
  await repos.workouts.saveWorkout(workout({ id, count: 3 }));
  await openVolume(repos);
  await layer().findByRole('heading', { name: 'Hard sets by muscle group' });
  expect(row('Chest')).toHaveTextContent('3 hard sets');
  expect(row('Triceps')).toHaveTextContent('1.5 hard sets');

  await repos.customExercises.saveCustomExercise(
    new Exercise({ id, name: 'Custom lift', equipment: source.equipment, primary: 'back' }),
  );
  await expect.poll(() => row('Chest')?.textContent ?? '').toContain('0 hard sets');
  await repos.customExercises.deleteCustomExercise(id);
  expect(await layer().findByText(/3 current and 0 previous hard sets omitted/)).toBeInTheDocument();
});

for (const custom of [false, true]) {
  it(`${custom ? 'exercise' : 'workout'} read failure and retry`, async () => {
    const repos = await fresh();
    const workouts = failsFirst<Workout[]>([]);
    const exercises = failsFirst<Exercise[]>([]);
    await openVolume(repos, (services) =>
      custom
        ? {
            ...services,
            customExercises: overriding(services.customExercises, { watchCustomExercises: exercises.watch }),
          }
        : { ...services, workouts: overriding(services.workouts, { watchWorkouts: workouts.watch }) },
    );
    expect(layer().queryByRole('heading', { name: 'Hard sets by muscle group' })).not.toBeInTheDocument();
    await userEvent.click(await layer().findByRole('button', { name: 'Retry volume' }));
    expect(await layer().findByRole('heading', { name: 'Last seven days' })).toBeInTheDocument();
    expect((custom ? exercises : workouts).attempts()).toBe(2);
  });
}
