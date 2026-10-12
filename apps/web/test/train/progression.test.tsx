import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { ExerciseProgression } from '../../src/domain/training/ExerciseProgression';
import type { UnitSystem } from '../../src/domain/UnitSystem';
import { Units } from '../../src/domain/Units';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';
import {
  addSet,
  choose,
  exerciseCard,
  findSetEditor,
  finishedWorkout,
  layer,
  openTrain,
  pressInSet,
  set,
  startWorkout,
  storedWorkouts,
  workoutRows,
} from '../support/train';

/**
 * MM-79: a suggestion for what to lift next, shown on the exercise and
 * starting its first set. Carried over from progression_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function setUpUser({ goal = 'leanGain', units = 'metric' }: { goal?: GoalMode; units?: UnitSystem } = {}) {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-40), goalMode: goal, healthCheckConfirmedOn: today }).copyWith({
      unitSystem: units,
    }),
  );
  await repos.weights.saveWeight(today, 82);
}

beforeEach(() => setUpUser());

/** A finished session of `exerciseId`, `daysAgo`: sets of (reps, kg). */
const did = (daysAgo: number, sets: readonly (readonly [number, number])[], exerciseId = 'back-squat') =>
  repos.workouts.saveWorkout(finishedWorkout(today, daysAgo, [[exerciseId, sets.map(([reps, kg]) => set(reps, kg))]]));

const names: Readonly<Record<string, string>> = { 'back-squat': 'Back squat', 'pull-up': 'Pull-up' };

/** A workout in progress with `exerciseId` added. */
async function startWith(exerciseId: string): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTrain();
  await startWorkout();
  const name = names[exerciseId] as string;
  await choose(name);
  return exerciseCard(name);
}

const suggestion = (card: HTMLElement) => card.querySelector('.train-suggestion')?.textContent ?? undefined;
const settingsRow = () => layer().getByRole('button', { name: /^Suggestions use/ });

async function firstSet() {
  await addSet();
  await findSetEditor();
  return (await storedWorkouts(repos))[0]?.exercises[0]?.sets[0];
}

it('nothing is suggested for an exercise never done', async () => {
  const card = await startWith('back-squat');
  expect(suggestion(card)).toBeUndefined();
  const added = await firstSet();
  expect(added?.reps).toBe(0);
  expect(added?.loadKg).toBe(0);
});

it('short of the top of the range: the same load for more reps', async () => {
  await did(7, [
    [8, 60],
    [8, 60],
    [7, 60],
  ]);
  const card = await startWith('back-squat');
  expect(suggestion(card)).toBe('One more rep on any set would be a step up.');
  const added = await firstSet();
  expect(added?.reps).toBe(8);
  expect(added?.loadKg).toBe(60);
});

it('every set at the top: more load, at the bottom of the range', async () => {
  await did(7, [
    [10, 60],
    [10, 60],
    [10, 60],
  ]);
  const card = await startWith('back-squat');
  expect(suggestion(card)).toBe('Every set reached 10 last time. A step up would be 62.5 kg × 6.');
  const added = await firstSet();
  expect(added?.reps).toBe(6);
  expect(added?.loadKg).toBe(62.5);
});

it('the first set starts from the working sets, not a warm-up', async () => {
  await did(7, [
    [10, 20],
    [8, 60],
    [7, 60],
  ]);
  await startWith('back-squat');
  const added = await firstSet();
  expect(added?.reps).toBe(8);
  expect(added?.loadKg).toBe(60);
});

it('the suggestion can be changed freely, and later sets copy the set before', async () => {
  await did(7, [
    [10, 60],
    [10, 60],
  ]);
  await startWith('back-squat');
  await addSet();
  await pressInSet('More: Reps');
  await expect.poll(async () => (await storedWorkouts(repos))[0]?.exercises[0]?.sets[0]?.reps).toBe(7);
  await addSet();
  await findSetEditor(2);
  const sets = (await storedWorkouts(repos))[0]?.exercises[0]?.sets ?? [];
  expect(sets.map((s) => s.reps)).toEqual([7, 7]);
  expect(sets.map((s) => s.loadKg)).toEqual([62.5, 62.5]);
});

it('three sessions at one load without more reps: hold', async () => {
  await did(21, [
    [8, 60],
    [7, 60],
  ]);
  await did(14, [
    [8, 60],
    [6, 60],
  ]);
  await did(7, [
    [8, 60],
    [7, 60],
  ]);
  const card = await startWith('back-squat');
  expect(suggestion(card)).toBe('No more reps at this load in three sessions. Holding 60 kg × 8 is a fair aim.');
  const added = await firstSet();
  expect(added?.reps).toBe(8);
  expect(added?.loadKg).toBe(60);
});

it('on a fat loss goal the suggestion is to match last time', async () => {
  await setUpUser({ goal: 'fatLoss' });
  await did(7, [
    [10, 60],
    [10, 60],
  ]);
  const card = await startWith('back-squat');
  expect(suggestion(card)).toBe('Matching last time holds your strength while you lose fat.');
  const added = await firstSet();
  expect(added?.reps).toBe(10);
  expect(added?.loadKg).toBe(60);
});

it('pounds step by a round number of pounds', async () => {
  await setUpUser({ units: 'imperial' });
  const kg = Units.lbToKg(135);
  await did(7, [
    [10, kg],
    [10, kg],
  ]);
  const card = await startWith('back-squat');
  expect(suggestion(card)).toBe('Every set reached 10 last time. A step up would be 140 lb × 6.');
  const added = await firstSet();
  expectClose(Units.kgToLb(added?.loadKg ?? 0), 140, 1e-9);
});

it('the body alone: more reps, with no load to name', async () => {
  await did(
    7,
    [
      [14, 0],
      [12, 0],
    ],
    'pull-up',
  );
  const card = await startWith('pull-up');
  expect(suggestion(card)).toBe('One more rep on any set would be a step up.');
});

it('assisted work steps toward less help', async () => {
  await did(
    7,
    [
      [12, -20],
      [12, -20],
    ],
    'pull-up',
  );
  const card = await startWith('pull-up');
  expect(suggestion(card)).toBe('Every set reached 12 last time. A step up would be 15 kg assisted × 8.');
});

it('a finished workout shows no suggestion', async () => {
  await did(14, [[8, 60]]);
  await did(7, [[8, 60]]);
  renderApp(repos, today);
  await openTrain();
  await userEvent.click(workoutRows()[0] as HTMLElement);
  await layer().findByRole('heading', { name: 'Back squat' });
  expect(suggestion(exerciseCard('Back squat'))).toBeUndefined();
  expect(layer().queryByRole('button', { name: /^Suggestions use/ })).not.toBeInTheDocument();
});

describe('a range and step of the user’s own', () => {
  const saved = () => first(repos.exerciseProgressions.watchExerciseProgressions());
  const field = (label: string) => layer().getByRole<HTMLInputElement>('textbox', { name: label });

  async function type(label: string, text: string): Promise<void> {
    await userEvent.clear(field(label));
    if (text !== '') await userEvent.type(field(label), text);
  }

  async function openSettings(): Promise<void> {
    await userEvent.click(settingsRow());
    await layer().findByRole('textbox', { name: 'Fewest reps' });
    await expect.poll(() => field('Fewest reps').value).not.toBe('');
  }

  async function save(): Promise<void> {
    await userEvent.click(layer().getByRole('button', { name: 'Save' }));
    await layer().findByRole('button', { name: 'Add exercise' });
  }

  it('the exercise says what suggestions use, the defaults to begin with', async () => {
    await did(7, [
      [8, 60],
      [8, 60],
    ]);
    await startWith('back-squat');
    expect(settingsRow()).toHaveTextContent('6 to 10 reps · 2.5 kg steps');
  });

  it('a range and a step can be set, and the suggestion follows', async () => {
    await did(7, [
      [5, 100],
      [5, 100],
    ]);
    const card = await startWith('back-squat');
    expect(suggestion(card)).toBe('One more rep on any set would be a step up.');
    await openSettings();
    await type('Fewest reps', '3');
    await type('Most reps', '5');
    await type('Load step', '5');
    await save();
    const kept = await saved();
    expect(kept).toHaveLength(1);
    expect(
      kept[0]?.equals(new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 3, repsHigh: 5, loadStepKg: 5 })),
    ).toBe(true);
    expect(settingsRow()).toHaveTextContent('3 to 5 reps · 5 kg steps');
    expect(suggestion(exerciseCard('Back squat'))).toBe('Every set reached 5 last time. A step up would be 105 kg × 3.');
    const added = await firstSet();
    expect(added?.reps).toBe(3);
    expect(added?.loadKg).toBe(105);
  });

  it('an empty step keeps the usual one, and the screen opens on what is saved', async () => {
    await did(7, [[8, 60]]);
    await startWith('back-squat');
    await openSettings();
    expect(layer().getByText(/Leave empty for the usual step: 2\.5 kg\./)).toBeInTheDocument();
    await type('Fewest reps', '5');
    await type('Most reps', '8');
    await save();
    expect((await saved())[0]?.loadStepKg).toBeUndefined();
    expect(settingsRow()).toHaveTextContent('5 to 8 reps · 2.5 kg steps');
    await openSettings();
    expect(field('Fewest reps')).toHaveValue('5');
  });

  it('a range that is no range cannot be saved, and says why', async () => {
    await did(7, [[8, 60]]);
    await startWith('back-squat');
    await openSettings();
    await type('Fewest reps', '10');
    await type('Most reps', '8');
    expect(layer().getByText('The most reps has to be more than the fewest.')).toBeInTheDocument();
    expect(layer().getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(await saved()).toEqual([]);
    await type('Most reps', '12');
    await type('Load step', '0');
    expect(layer().getByText('The load step is a number above zero, or left empty.')).toBeInTheDocument();
  });

  it('the defaults can be taken back', async () => {
    await repos.exerciseProgressions.saveExerciseProgression(
      new ExerciseProgression({ exerciseId: 'back-squat', repsLow: 3, repsHigh: 5 }),
    );
    await did(7, [[8, 60]]);
    await startWith('back-squat');
    expect(settingsRow()).toHaveTextContent('3 to 5 reps');
    await openSettings();
    await userEvent.click(layer().getByRole('button', { name: 'Use the defaults' }));
    await layer().findByRole('button', { name: 'Add exercise' });
    expect(await saved()).toEqual([]);
    expect(settingsRow()).toHaveTextContent('6 to 10 reps');
  });

  it('pounds are typed for the step, kilograms are stored', async () => {
    await setUpUser({ units: 'imperial' });
    await did(7, [[8, 60]]);
    await startWith('back-squat');
    await openSettings();
    await type('Load step', '10');
    await save();
    expectClose(Units.kgToLb((await saved())[0]?.loadStepKg ?? 0), 10, 1e-9);
    expect(settingsRow()).toHaveTextContent('10 lb steps');
  });
});
