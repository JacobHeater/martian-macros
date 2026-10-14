import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CalendarDate } from '../../src/domain/CalendarDate';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import type { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { first } from './first';
import { openTab } from './openTab';
import { topLayer } from './topLayer';

/** What presses and types: `userEvent`, or one set up for a test with its own timers. */
export type User = Pick<typeof userEvent, 'click' | 'type' | 'clear'>;

/** The screen on top, to look things up in. */
export const layer = () => within(topLayer());

/** The workouts as stored, newest first. */
export const storedWorkouts = (repos: InMemoryRepositories) => first(repos.workouts.watchWorkouts());

/** A set of (reps, kg), and reps in reserve when given. */
export const set = (reps: number, loadKg: number, rir?: number) => new WorkoutSet({ reps, loadKg, rir });

/** A finished fifty-minute workout at six in the evening, `daysAgo` before `today`. */
export function finishedWorkout(
  today: CalendarDate,
  daysAgo: number,
  exercises: readonly (readonly [exerciseId: string, sets: readonly WorkoutSet[], restTargetMs?: number])[],
): Workout {
  const date = today.addDays(-daysAgo);
  const startedAt = new Date(date.year, date.month - 1, date.day, 18);
  return new Workout({
    id: 0,
    date,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 50 * 60000),
    exercises: exercises.map(([exerciseId, sets, restTargetMs]) => new WorkoutExercise({ exerciseId, sets, restTargetMs })),
  });
}

/** Opens the Train destination of an app already drawn. */
export async function openTrain(): Promise<void> {
  await openTab('Train');
  await screen.findByRole('button', { name: 'Weekly training volume' });
}

/** Starts a workout from the Train screen and waits for it to open. */
export async function startWorkout(user: User = userEvent): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Start workout' }));
  await layer().findByRole('button', { name: 'Add exercise' });
}

/** Adds an exercise to the open workout: found by `query` when given, and picked by its name. */
export async function choose(name: string, query?: string, user: User = userEvent): Promise<void> {
  await user.click(layer().getByRole('button', { name: 'Add exercise' }));
  await layer().findByRole('textbox', { name: 'Search exercises' });
  if (query !== undefined) await user.type(layer().getByRole('textbox', { name: 'Search exercises' }), query);
  await user.click(layer().getAllByRole('button', { name: new RegExp(`^${name}`) })[0] as HTMLElement);
  await layer().findByRole('heading', { name });
}

/** The card of the exercise called `name` in the open workout. */
export const exerciseCard = (name: string) =>
  layer().getByRole('heading', { name }).closest('.mm-surface') as HTMLElement;

/** Presses "Add set" on the exercise at `index` of the open workout. */
export async function addSet(index = 0, user: User = userEvent): Promise<void> {
  await user.click(layer().getAllByRole('button', { name: 'Add set' })[index] as HTMLElement);
}

/** The open controls of set `number`. */
export const setEditor = (number = 1) => layer().getByRole('group', { name: `Set ${number}` });
export const findSetEditor = (number = 1) => layer().findByRole('group', { name: `Set ${number}` });

/** Types `text` in the field called `label` of the open set, replacing what is there. */
export async function typeInSet(label: string, text: string, number = 1, user: User = userEvent): Promise<void> {
  const field = within(await findSetEditor(number)).getByRole('textbox', { name: label });
  await user.clear(field);
  if (text !== '') await user.type(field, text);
}

/** Presses a button of the open set: "More: Reps", "Less: Load", a reps-in-reserve figure, "Remove set". */
export async function pressInSet(label: string | RegExp, number = 1, user: User = userEvent): Promise<void> {
  await user.click(within(await findSetEditor(number)).getByRole('button', { name: label }));
}

/**
 * The rows of finished workouts on the Train screen, newest first: the rows
 * of the week and month sections (MM-258), each named by its day.
 */
export const workoutRows = () =>
  screen.getAllByRole('button', { name: /^(Today|Yesterday|[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2})/ });
