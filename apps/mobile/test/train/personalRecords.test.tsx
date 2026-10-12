import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { renderApp } from '../support/renderApp';
import { addSet, finishedWorkout, layer, openTrain, pressInSet, set, workoutRows } from '../support/train';

/** MM-92: personal records, marked on the workout that set them. Carried over from personal_records_test.dart. */
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

const did = (daysAgo: number, squatKg: number) =>
  repos.workouts.saveWorkout(finishedWorkout(today, daysAgo, [['back-squat', [set(5, squatKg)]]]));

async function open(): Promise<void> {
  renderApp(repos, today);
  await openTrain();
}

const recordsCard = () => layer().queryByRole('heading', { name: /^Personal records?$/ })?.closest('.mm-surface') ?? null;

it('a workout that beat the lift’s best is marked, in the list and when opened', async () => {
  await did(14, 100);
  await did(7, 105);
  await open();
  // Newest first.
  const [second, first] = workoutRows();
  expect(second).toHaveTextContent('1 personal record');
  expect(first).not.toHaveTextContent('personal record');
  await userEvent.click(second as HTMLElement);
  expect(await layer().findByRole('heading', { name: 'Personal record' })).toBeInTheDocument();
  // Five reps: the estimate is the load and a sixth more.
  expect(layer().getByText('Back squat: estimated max 122.5 kg, up from 116.7 kg.')).toBeInTheDocument();
});

it('a workout that matched it is not', async () => {
  await did(14, 100);
  await did(7, 100);
  await open();
  const [second] = workoutRows();
  expect(second).not.toHaveTextContent('personal record');
  await userEvent.click(second as HTMLElement);
  await layer().findByRole('heading', { name: 'Back squat' });
  expect(recordsCard()).toBeNull();
});

it('finishing a workout with a better set marks it', async () => {
  await did(7, 100);
  await open();
  await userEvent.click(screen.getByRole('button', { name: 'Repeat last workout' }));
  await layer().findByRole('heading', { name: 'Back squat' });
  await addSet();
  await pressInSet('More: Load');
  await expect.poll(() => layer().getByRole('button', { name: 'Finish workout' }).hasAttribute('disabled')).toBe(false);
  await userEvent.click(layer().getByRole('button', { name: 'Finish workout' }));
  await expect.poll(() => workoutRows()[0]?.textContent ?? '').toContain('1 personal record');
});

it('nothing about a record mentions body weight or eating', async () => {
  await did(14, 100);
  await did(7, 105);
  await open();
  await userEvent.click(workoutRows()[0] as HTMLElement);
  await layer().findByRole('heading', { name: 'Personal record' });
  const card = (recordsCard()?.textContent ?? '').toLowerCase();
  expect(card).not.toBe('');
  for (const word of ['lowest', 'deficit', 'calorie', 'kcal', 'lost']) expect(card, word).not.toContain(word);
});
