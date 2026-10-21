import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { UnitSystem } from '../../src/domain/UnitSystem';
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
  setEditor,
  startWorkout,
  storedWorkouts,
  typeInSet,
  workoutRows,
} from '../support/train';

/** MM-75 and MM-76: logging a workout set by set, and choosing its exercises. Carried over from train_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function setUpUser(units: UnitSystem): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: units }),
  );
  await repos.weights.saveWeight(today, 82);
}

beforeEach(() => setUpUser('metric'));

const stored = () => storedWorkouts(repos);
const onlySet = async () => (await stored())[0]?.exercises[0]?.sets[0];

async function open() {
  const view = renderApp(repos, today);
  await openTrain();
  return view;
}

/** A workout in progress with a back squat in it. */
async function squats(): Promise<void> {
  await open();
  await startWorkout();
  await choose('Back squat', 'back squat');
}

it('Train is a destination, empty until something is logged', async () => {
  await open();
  expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Repeat last workout' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Workouts' })).not.toBeInTheDocument();
});

it('the next set is a copy of the last, in one tap', async () => {
  await squats();
  await addSet();
  await typeInSet('Reps', '8');
  await typeInSet('Load', '100');
  await addSet();
  await findSetEditor(2);
  const sets = (await stored())[0]?.exercises[0]?.sets ?? [];
  expect(sets.map((s) => s.reps)).toEqual([8, 8]);
  expect(sets.map((s) => s.loadKg)).toEqual([100, 100]);
  // The first set is back to a line; the new one is open to adjust.
  expect(layer().getByRole('button', { name: /^8 × 100 kg/ })).toBeInTheDocument();
  expect(within(setEditor(2)).getByRole('textbox', { name: 'Reps' })).toHaveValue('8');
});

it('reps and load step with the buttons, and RIR is optional', async () => {
  await squats();
  await addSet();
  await typeInSet('Reps', '8');
  await typeInSet('Load', '100');
  await pressInSet('Less: Reps');
  await pressInSet('More: Load');
  await pressInSet('More: Load');
  await expect.poll(async () => (await onlySet())?.loadKg).toBe(105);
  expect((await onlySet())?.reps).toBe(7);
  expect((await onlySet())?.rir).toBeUndefined();

  await pressInSet('2');
  await expect.poll(async () => (await onlySet())?.rir).toBe(2);
  // Tapping the chosen one again clears it.
  await pressInSet('2');
  await expect.poll(async () => (await onlySet())?.rir).toBeUndefined();
});

it('two quick changes to a set are both kept', async () => {
  await squats();
  await addSet();
  await typeInSet('Reps', '8');
  await typeInSet('Load', '100');
  // Nothing drawn between the presses: the second must not start from a
  // set that has not heard of the first.
  const editor = within(setEditor());
  fireEvent.click(editor.getByRole('button', { name: 'More: Reps' }));
  fireEvent.click(editor.getByRole('button', { name: 'More: Load' }));
  fireEvent.click(editor.getByRole('button', { name: '1' }));
  await expect.poll(async () => (await onlySet())?.rir).toBe(1);
  expect((await onlySet())?.reps).toBe(9);
  expect((await onlySet())?.loadKg).toBe(102.5);
});

it('a load is never stepped below zero for a weighted exercise', async () => {
  await squats();
  await addSet();
  await pressInSet('Less: Load');
  expect((await onlySet())?.loadKg).toBe(0);
  expect(within(setEditor()).getByRole('textbox', { name: 'Load' })).toHaveValue('0');
});

it('assisted bodyweight work is a load below zero', async () => {
  await open();
  await startWorkout();
  await choose('Pull-up', 'pull');
  await addSet();
  await typeInSet('Reps', '6');
  await pressInSet('Less: Added weight');
  await pressInSet('Less: Added weight');
  await expect.poll(async () => (await onlySet())?.loadKg).toBe(-5);
  await addSet();
  expect(await layer().findByRole('button', { name: /^6 × 5 kg assisted/ })).toBeInTheDocument();
});

it('last time is shown beside today, and starts the first set', async () => {
  await repos.workouts.saveWorkout(finishedWorkout(today, 7, [['back-squat', [set(8, 100, 2), set(7, 100)]]]));
  await squats();
  expect(layer().getByText('Last time: 8 × 100 kg · 2 RIR, 7 × 100 kg')).toBeInTheDocument();
  await addSet();
  await findSetEditor();
  const added = await onlySet();
  expect(added?.reps).toBe(8);
  expect(added?.loadKg).toBe(100);
  expect(added?.rir, 'RIR is a judgment of one set').toBeUndefined();
});

it('pounds are entered and shown, kilograms are stored', async () => {
  await setUpUser('imperial');
  await squats();
  await addSet();
  await typeInSet('Reps', '5');
  await typeInSet('Load', '225');
  await expect.poll(async () => (await onlySet())?.reps).toBe(5);
  expectClose((await onlySet())?.loadKg ?? 0, 102.1, 0.05);
  await addSet();
  expect(await layer().findByRole('button', { name: /^5 × 225 lb/ })).toBeInTheDocument();
});

it('a workout in progress survives the app closing', async () => {
  const view = await open();
  await startWorkout();
  await choose('Back squat', 'back squat');
  await addSet();
  await typeInSet('Reps', '8');
  await typeInSet('Load', '100');
  await expect.poll(async () => (await onlySet())?.loadKg).toBe(100);

  // Close the app and open it again on the same data.
  view.unmount();
  await open();
  expect(screen.getByRole('heading', { name: 'Workout in progress' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start workout' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await layer().findByRole('heading', { name: 'Back squat' })).toBeInTheDocument();
  expect(layer().getByRole('button', { name: /^8 × 100 kg/ })).toBeInTheDocument();
});

it('finishing lists the workout, which can be reopened', async () => {
  await open();
  await startWorkout();
  const finish = () => layer().getByRole('button', { name: 'Finish workout' });
  expect(finish(), 'nothing logged yet').toBeDisabled();
  await choose('Back squat', 'back squat');
  await addSet();
  await findSetEditor();
  expect(finish(), 'a set with no reps yet').toBeDisabled();
  // A new set's fields are empty, not zero, so nothing has to be cleared.
  expect(within(setEditor()).getByRole('textbox', { name: 'Reps' })).toHaveValue('');
  await typeInSet('Reps', '8');
  await expect.poll(() => finish().hasAttribute('disabled')).toBe(false);
  await userEvent.click(finish());

  expect(await screen.findByRole('button', { name: 'Repeat last workout' })).toBeInTheDocument();
  const workout = (await stored())[0];
  expect(await stored()).toHaveLength(1);
  expect(workout?.inProgress).toBe(false);
  expect(workout?.date).toBe(today);
  expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument();
  expect(screen.getByText('1 exercise · 1 set · 0 min')).toBeInTheDocument();
  await userEvent.click(workoutRows()[0] as HTMLElement);
  expect(await layer().findByRole('heading', { name: 'Back squat' })).toBeInTheDocument();
  expect(layer().queryByRole('button', { name: 'Finish workout' })).not.toBeInTheDocument();
});

it('repeating the last workout starts with its exercises', async () => {
  await repos.workouts.saveWorkout(
    finishedWorkout(today, 2, [
      ['back-squat', [set(8, 100)]],
      ['leg-press', [set(12, 180)]],
    ]),
  );
  await open();
  await userEvent.click(screen.getByRole('button', { name: 'Repeat last workout' }));
  expect(await layer().findByRole('heading', { name: 'Back squat' })).toBeInTheDocument();
  const started = (await stored())[0];
  expect(started?.inProgress).toBe(true);
  expect(started?.exercises.map((e) => e.exerciseId)).toEqual(['back-squat', 'leg-press']);
  expect(started?.setCount).toBe(0);
  expect(layer().getByText('Last time: 8 × 100 kg')).toBeInTheDocument();
});

it('a set and an exercise can be removed, and a workout deleted', async () => {
  await squats();
  await addSet();
  await addSet();
  await pressInSet('Remove set', 2);
  await expect.poll(async () => (await stored())[0]?.setCount).toBe(1);
  await userEvent.click(layer().getByRole('button', { name: 'Remove Back squat' }));
  // It has a set, so the app asks first.
  const sure = await screen.findByRole('dialog', { name: 'Remove this exercise?' });
  await userEvent.click(within(sure).getByRole('button', { name: 'Remove' }));
  await expect.poll(async () => (await stored())[0]?.exercises.length).toBe(0);
  await userEvent.click(layer().getByRole('button', { name: 'Delete workout' }));
  const gone = await screen.findByRole('dialog', { name: 'Delete this workout?' });
  await userEvent.click(within(gone).getByRole('button', { name: 'Delete' }));
  await expect.poll(async () => (await stored()).length).toBe(0);
  expect(await screen.findByRole('button', { name: 'Start workout' })).toBeInTheDocument();
});

describe('choosing an exercise', () => {
  async function picker(): Promise<void> {
    await open();
    await startWorkout();
    await userEvent.click(layer().getByRole('button', { name: 'Add exercise' }));
    await layer().findByRole('textbox', { name: 'Search exercises' });
  }
  const search = (text: string) => userEvent.type(layer().getByRole('textbox', { name: 'Search exercises' }), text);

  it('"bench" finds the bench presses', async () => {
    await picker();
    await search('bench');
    for (const name of ['Barbell bench press', 'Dumbbell bench press', 'Incline barbell bench press']) {
      expect(layer().getByRole('button', { name: new RegExp(`^${name}`) })).toBeInTheDocument();
    }
    expect(layer().queryByRole('button', { name: /^Back squat/ })).not.toBeInTheDocument();
  });

  it('recently used exercises come first, before any search', async () => {
    await repos.workouts.saveWorkout(finishedWorkout(today, 3, [['walking-lunge', [set(10, 20)]]]));
    await picker();
    const recent = layer().getByText('Recent');
    const lunge = layer().getByRole('button', { name: /^Walking lunge/ });
    const all = layer().getByText('All exercises');
    expect(recent.compareDocumentPosition(lunge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lunge.compareDocumentPosition(all) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('an exercise of your own is created, chosen and kept', async () => {
    await picker();
    await search('Landmine press');
    expect(layer().getByText('No exercise by that name.')).toBeInTheDocument();
    await userEvent.click(layer().getByRole('button', { name: 'Create your own exercise' }));
    // The name typed in the search is carried over.
    expect(await layer().findByRole('textbox', { name: 'Name' })).toHaveValue('Landmine press');
    await userEvent.click(layer().getByRole('button', { name: /^Main muscle group/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Shoulders' }));
    await userEvent.click(layer().getByRole('button', { name: 'Triceps' }));
    await userEvent.click(layer().getByRole('button', { name: 'Save exercise' }));

    expect(await layer().findByRole('heading', { name: 'Landmine press' })).toBeInTheDocument();
    const custom = (await first(repos.customExercises.watchCustomExercises()))[0];
    expect(custom?.name).toBe('Landmine press');
    expect(custom?.primary).toBe('shoulders');
    expect(custom?.secondary).toEqual(['triceps']);
    // It was added to the workout, and can be logged against.
    expect((await stored())[0]?.exercises[0]?.exerciseId).toBe(custom?.id);
    await addSet();
    await expect.poll(async () => (await stored())[0]?.setCount).toBe(1);
  });
});

/**
 * Two defects in a workout set's controls, found by the walkthrough review
 * of workout logging (MM-212), each skipped until its fix and enabled with
 * it: MM-214 and MM-215.
 */
describe('the set controls keep the field and the set in step', () => {
  for (const typed of ['', '8.5']) {
    it(`MM-214: the reps field shows what is stored, after typing "${typed}" over 8`, async () => {
      await squats();
      await addSet();
      await typeInSet('Reps', '8');
      await typeInSet('Reps', typed);
      const shown = Number.parseInt(within(setEditor()).getByRole<HTMLInputElement>('textbox', { name: 'Reps' }).value, 10);
      await expect.poll(async () => (await onlySet())?.reps).toBe(Number.isNaN(shown) ? 0 : shown);
    });
  }

  it('MM-214: a number of reps that is not whole is said not to be kept', async () => {
    await squats();
    await addSet();
    await typeInSet('Reps', '8');
    await typeInSet('Reps', '8.5');
    expect(within(setEditor()).getByRole('alert')).toHaveTextContent('Whole reps only. The set has 8.');
    expect((await onlySet())?.reps).toBe(8);
    // A whole number again takes it away.
    await typeInSet('Reps', '9');
    expect(within(setEditor()).queryByRole('alert')).not.toBeInTheDocument();
    await expect.poll(async () => (await onlySet())?.reps).toBe(9);
  });

  it('MM-214: a cleared load is no load', async () => {
    await squats();
    await addSet();
    await typeInSet('Load', '100');
    await expect.poll(async () => (await onlySet())?.loadKg).toBe(100);
    await typeInSet('Load', '');
    await expect.poll(async () => (await onlySet())?.loadKg).toBe(0);
  });

  it('MM-214: the reps keyboard has no decimal point', async () => {
    await squats();
    await addSet();
    expect(within(setEditor()).getByRole('textbox', { name: 'Reps' })).toHaveAttribute('inputmode', 'numeric');
  });

  it('MM-215: removing a set can be undone', async () => {
    await squats();
    await addSet();
    await typeInSet('Reps', '8');
    await expect.poll(async () => (await onlySet())?.reps).toBe(8);
    const before = await onlySet();
    await pressInSet('Remove set');
    await expect.poll(async () => (await stored())[0]?.setCount).toBe(0);
    await userEvent.click(await screen.findByRole('button', { name: 'Undo' }));
    await expect.poll(async () => (await onlySet())?.reps).toBe(8);
    // As it was, times included.
    expect(await onlySet()).toEqual(before);
  });
});

/** MM-222: a logged set looks logged, and the next action is in reach. */
describe('the set just added', () => {
  it('says it is recorded, and closes back to its row', async () => {
    await squats();
    await addSet();
    await typeInSet('Reps', '8');
    await typeInSet('Load', '100');
    expect(within(setEditor()).getByText('Recorded. Changes are kept as you make them.')).toBeInTheDocument();
    await pressInSet('Done');
    expect(layer().queryByRole('group', { name: 'Set 1' })).not.toBeInTheDocument();
    expect(layer().getByRole('button', { name: /^8 × 100 kg/ })).toBeInTheDocument();
  });

  it('a closed set shows that it opens', async () => {
    await squats();
    await addSet();
    await pressInSet('Done');
    const row = layer().getByRole('button', { name: /Set 1$/ });
    expect(row.querySelector('.mm-list-row-opens')).not.toBeNull();
  });

  it('"Add set" says what it does in a workout under way', async () => {
    await squats();
    expect(within(exerciseCard('Back squat')).getByText('Records a set finished now and starts the rest.')).toBeInTheDocument();
  });

  it('the timer bar offers no set to time before there is an exercise', async () => {
    await open();
    await startWorkout();
    const bar = document.querySelector('.train-timer') as HTMLElement;
    expect(within(bar).getByRole('button', { name: 'Start set' })).toBeDisabled();
    expect(within(bar).getByText('Add an exercise to time a set.')).toBeInTheDocument();
  });
});
