import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import type { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { renderApp } from '../support/renderApp';
import { enterClock, enterDate, enterTime, minutes, pass, seconds, settle, user, withTimersInHand } from '../support/time';
import {
  addSet,
  choose,
  exerciseCard,
  layer,
  openTrain,
  pressInSet,
  startWorkout,
  storedWorkouts,
  workoutRows,
} from '../support/train';

/**
 * MM-191: a target rest and its signal, a set's times to the second, and a
 * workout that ends after midnight. Carried over from rest_target_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
const noon = new Date(2026, 9, 5, 12);
let repos: InMemoryRepositories;
let clock: FixedClock;
let signalled: number;

withTimersInHand();

beforeEach(async () => {
  signalled = 0;
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  await repos.weights.saveWeight(today, 82);
});

const stored = () => storedWorkouts(repos);
const only = async () => {
  const workouts = await stored();
  expect(workouts).toHaveLength(1);
  return workouts[0] as Workout;
};

/** Lets time pass, on the app's clock and for its timers alike. */
const wait = (ms: number) => pass(clock, ms);

async function open(): Promise<void> {
  const view = renderApp(repos, today, {
    change: (services) => ({ ...services, restSignal: { restOver: () => (signalled += 1) } }),
  });
  clock = view.clock;
  await openTrain();
}

/** A workout in progress with a back squat in it. */
async function startSquats(): Promise<void> {
  await open();
  await startWorkout(user);
  await choose('Back squat', undefined, user);
}

async function press(name: string | RegExp): Promise<void> {
  await user.click(layer().getByRole('button', { name }));
  await settle();
}

async function add(): Promise<void> {
  await addSet(0, user);
  await settle();
}

/** Chooses a rest target from the list: "None", "1:00", "1:30", "2:00", "3:00" or "5:00". */
async function chooseRest(option: string): Promise<void> {
  await press(/^Rest target/);
  await user.click(within(await screen.findByRole('listbox', { name: 'Rest target' })).getByRole('option', { name: option }));
  await settle();
}

const timerLabel = () => document.querySelector('.train-timer-label')?.textContent;
const timerTime = () => document.querySelector('.train-timer-time')?.textContent;

async function pressTimer(): Promise<void> {
  await user.click(document.querySelector('.train-timer button') as HTMLElement);
  await settle();
}

const squat = (init: { restTargetMs?: number; sets?: readonly WorkoutSet[] } = {}) =>
  new WorkoutExercise({
    exerciseId: 'back-squat',
    restTargetMs: init.restTargetMs,
    sets: init.sets ?? [new WorkoutSet({ reps: 8, loadKg: 100 })],
  });

async function openFinished(): Promise<void> {
  await open();
  await user.click(workoutRows()[0] as HTMLElement);
  await layer().findByRole('heading', { name: 'Back squat' });
}

/** A workout from 11:30 PM two days ago to 11:50 PM that night. */
const saveLateWorkout = () =>
  repos.workouts.saveWorkout(
    new Workout({
      id: 0,
      date: today.addDays(-2),
      startedAt: new Date(2026, 9, 3, 23, 30),
      endedAt: new Date(2026, 9, 3, 23, 50),
      exercises: [squat()],
    }),
  );

describe('a target rest', () => {
  it('starts as none, and the rest then counts up', async () => {
    await startSquats();
    expect(layer().getByRole('button', { name: /^Rest target/ })).toHaveTextContent('None');
    await add();
    await wait(seconds(45));
    expect(timerLabel()).toBe('Rest');
    expect(timerTime()).toBe('0:45');
    expect((await only()).exercises[0]?.restTargetMs).toBeUndefined();
  });

  it('is counted down to', async () => {
    await startSquats();
    await chooseRest('2:00');
    expect((await only()).exercises[0]?.restTargetMs).toBe(minutes(2));
    await add();
    await wait(seconds(90));
    expect(timerLabel()).toBe('Rest left · 2:00 target');
    expect(timerTime()).toBe('0:30');
  });

  it('is signalled once when reached, and the rest counts on', async () => {
    await startSquats();
    await chooseRest('1:00');
    await add();
    await wait(seconds(59));
    expect(signalled).toBe(0);
    await wait(seconds(1));
    expect(signalled).toBe(1);
    expect(timerLabel()).toBe('Target rest reached · 1:00 target');
    expect(timerTime()).toBe('1:00');
    await wait(seconds(30));
    expect(signalled).toBe(1);
    expect(timerTime()).toBe('1:30');
  });

  it('changed mid-rest is measured from when the rest began', async () => {
    await startSquats();
    await chooseRest('5:00');
    await add();
    await wait(seconds(40));
    await chooseRest('1:00');
    expect(timerTime()).toBe('0:20');
    await wait(seconds(20));
    expect(signalled).toBe(1);
  });

  it('turned off stops the countdown and the signal', async () => {
    await startSquats();
    await chooseRest('1:00');
    await add();
    await wait(seconds(20));
    await chooseRest('None');
    await wait(seconds(60));
    expect(signalled).toBe(0);
    expect(timerLabel()).toBe('Rest');
    expect(timerTime()).toBe('1:20');
  });

  it('is not signalled while a set is being timed', async () => {
    await startSquats();
    await chooseRest('1:00');
    await add();
    await wait(seconds(30));
    await pressTimer();
    await wait(seconds(60));
    expect(signalled).toBe(0);
    expect(timerLabel()).toBe('Set');
  });

  it('is not signalled while the workout is paused', async () => {
    await startSquats();
    await chooseRest('1:00');
    await add();
    await wait(seconds(30));
    await press('Pause');
    await wait(seconds(60));
    expect(signalled).toBe(0);
    expect(timerLabel()).toBe('Paused');
  });

  it('already passed when the app opens is shown, not signalled', async () => {
    await repos.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: today,
        startedAt: new Date(noon.getTime() - minutes(20)),
        exercises: [
          squat({
            restTargetMs: minutes(2),
            sets: [new WorkoutSet({ reps: 8, loadKg: 100, endedAt: new Date(noon.getTime() - minutes(5)) })],
          }),
        ],
      }),
    );
    await open();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await layer().findByRole('heading', { name: 'Back squat' });
    await wait(seconds(10));
    expect(signalled).toBe(0);
    expect(timerLabel()).toBe('Target rest reached · 2:00 target');
    expect(timerTime()).toBe('5:10');
  });

  const twoDaysAgo = (restTargetMs: number) =>
    repos.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: today.addDays(-2),
        startedAt: new Date(2026, 9, 3, 18),
        endedAt: new Date(2026, 9, 3, 19),
        exercises: [squat({ restTargetMs })],
      }),
    );

  it('is there again the next time the exercise is added', async () => {
    await twoDaysAgo(minutes(3));
    await startSquats();
    await settle();
    expect(layer().getByRole('button', { name: /^Rest target/ })).toHaveTextContent('3:00');
    const workout = (await stored())[0];
    expect(workout?.inProgress).toBe(true);
    expect(workout?.exercises[0]?.restTargetMs).toBe(minutes(3));
  });

  it('comes with the exercises of a repeated workout', async () => {
    await twoDaysAgo(seconds(90));
    await open();
    await user.click(screen.getByRole('button', { name: 'Repeat last workout' }));
    await layer().findByRole('heading', { name: 'Back squat' });
    expect((await stored())[0]?.exercises[0]?.restTargetMs).toBe(seconds(90));
  });
});

describe('a set’s times, to the second', () => {
  const onlySet = async () => (await only()).exercises[0]?.sets[0];

  /** A workout in progress, ten minutes in, with one set just added and its controls open. */
  async function oneSet(afterMs = minutes(10)): Promise<void> {
    await startSquats();
    await pass(clock, afterMs, 1000);
    await add();
  }

  it('a start and an end can be typed', async () => {
    await oneSet();
    await pressInSet(/^Ended/, 1, user);
    await enterClock(12, 2, 55);
    await pressInSet(/^Started/, 1, user);
    await enterClock(12, 2, 10);
    const set = await onlySet();
    expect(set?.startedAt).toEqual(new Date(2026, 9, 5, 12, 2, 10));
    expect(set?.endedAt).toEqual(new Date(2026, 9, 5, 12, 2, 55));
    expect(within(exerciseCard('Back squat')).getByText('12:02:10 PM')).toBeInTheDocument();
    // MM-222: the end is shown with how long the set took.
    expect(within(exerciseCard('Back squat')).getByText('12:02:55 PM · took 0:45')).toBeInTheDocument();
  });

  it('the entry opens on the time the set has', async () => {
    await oneSet(minutes(10) + seconds(7));
    await pressInSet(/^Ended/, 1, user);
    const dialog = within(await screen.findByRole('dialog', { name: 'Set ended' }));
    expect(dialog.getByRole('spinbutton', { name: 'Hour' })).toHaveValue(12);
    expect(dialog.getByRole('spinbutton', { name: 'Minute' })).toHaveValue(10);
    expect(dialog.getByRole('spinbutton', { name: 'Second' })).toHaveValue(7);
    expect(dialog.getByText('12:10:07 PM')).toBeInTheDocument();
  });

  it('the entry offers only times that exist, so nothing typed can be refused (MM-264)', async () => {
    await oneSet();
    await pressInSet(/^Started/, 1, user);
    const dialog = await enterClock(12, 5, 75, { confirm: false });
    // Seventy-five seconds is not on the drum: the second digit stands alone.
    expect(within(dialog).getByRole('spinbutton', { name: 'Second' })).toHaveAttribute('aria-valuemax', '59');
    expect(within(dialog).getByRole('spinbutton', { name: 'Second' })).toHaveValue(5);
    expect(within(dialog).getByRole('spinbutton', { name: 'Hour' })).toHaveAttribute('aria-valuemax', '12');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await settle();
    expect((await onlySet())?.startedAt).toBeUndefined();
  });

  it('after midnight is on the next day, in a workout that ran past it', async () => {
    await repos.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: today.addDays(-2),
        startedAt: new Date(2026, 9, 3, 23, 30),
        endedAt: new Date(2026, 9, 4, 0, 40),
        exercises: [squat()],
      }),
    );
    await openFinished();
    await press(/Set 1$/);
    await pressInSet(/^Ended/, 1, user);
    await enterClock(12, 10, 30, { period: 'AM' });
    expect((await onlySet())?.endedAt).toEqual(new Date(2026, 9, 4, 0, 10, 30));
  });
});

describe('a workout that ends after midnight', () => {
  async function openTimes(): Promise<void> {
    await saveLateWorkout();
    await openFinished();
    await press('Edit times');
    await layer().findByRole('heading', { name: 'Workout times' });
  }

  it('has its typed end put on the next day', async () => {
    await openTimes();
    await press(/^Ended/);
    await enterTime('Ended', '00:20');
    const workout = await only();
    expect(workout.startedAt).toEqual(new Date(2026, 9, 3, 23, 30));
    expect(workout.endedAt).toEqual(new Date(2026, 9, 4, 0, 20));
    expect(layer().getByRole('button', { name: /^Ended/ })).toHaveTextContent('12:20 AM, next day');
  });

  it('keeps its end on the day after when its day is changed', async () => {
    await openTimes();
    await press(/^Ended/);
    await enterTime('Ended', '00:20');
    await press(/^Day/);
    await enterDate('2026-10-02');
    const workout = await only();
    expect(workout.date).toBe(CalendarDate.of(2026, 10, 2));
    expect(workout.startedAt).toEqual(new Date(2026, 9, 2, 23, 30));
    expect(workout.endedAt).toEqual(new Date(2026, 9, 3, 0, 20));
  });

  it('does not get an end most of a day on from a slip', async () => {
    await openTimes();
    await press(/^Ended/);
    await enterTime('Ended', '23:20');
    expect(screen.getByText('The end has to be after the start.')).toBeInTheDocument();
    expect((await only()).endedAt).toEqual(new Date(2026, 9, 3, 23, 50));
  });
});
