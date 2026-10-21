import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { renderApp } from '../support/renderApp';
import { enterClock, enterDate, enterTime, minutes, pass, seconds, settle, user, withTimersInHand } from '../support/time';
import {
  addSet,
  choose,
  layer,
  openTrain,
  pressInSet,
  setEditor,
  startWorkout,
  storedWorkouts,
  typeInSet,
  workoutRows,
} from '../support/train';

/**
 * MM-191: a workout's times set by hand, its running clock, and the set
 * and rest timers. Carried over from workout_times_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
const noon = new Date(2026, 9, 5, 12);
const after = (ms: number) => new Date(noon.getTime() + ms);
let repos: InMemoryRepositories;
let clock: FixedClock;

withTimersInHand();

beforeEach(async () => {
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
const onlySet = async () => (await only()).exercises[0]?.sets[0];

/** Lets time pass on the app's clock and the displays tick once. */
const wait = (ms: number) => pass(clock, ms, 1000);

async function open() {
  const view = renderApp(repos, today);
  clock = view.clock;
  await openTrain();
  return view;
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

const elapsed = () => layer().getByText(/^\d+:\d\d(:\d\d)?$/, { selector: '.train-clock-time' }).textContent;
const clockLines = () => [...document.querySelectorAll('.app-layer:not([hidden]) .train-clock-line')].map((line) => line.textContent);
const timerLabel = () => document.querySelector('.train-timer-label')?.textContent;
const timerTime = () => document.querySelector('.train-timer-time')?.textContent;
const timerButton = () => document.querySelector<HTMLButtonElement>('.train-timer button') as HTMLButtonElement;

async function pressTimer(): Promise<void> {
  await user.click(timerButton());
  await settle();
}

const saveFinished = () =>
  repos.workouts.saveWorkout(
    new Workout({
      id: 0,
      date: today.addDays(-1),
      startedAt: new Date(2026, 9, 4, 18),
      endedAt: new Date(2026, 9, 4, 18, 50),
      exercises: [new WorkoutExercise({ exerciseId: 'back-squat', sets: [new WorkoutSet({ reps: 8, loadKg: 100 })] })],
    }),
  );

async function openFinished(): Promise<void> {
  await open();
  await user.click(workoutRows()[0] as HTMLElement);
  await layer().findByRole('heading', { name: 'Back squat' });
}

describe('the workout clock', () => {
  it('runs while a workout is in progress', async () => {
    await startSquats();
    expect(elapsed()).toBe('0:00');
    await wait(minutes(12) + seconds(5));
    expect(elapsed()).toBe('12:05');
    expect(clockLines()).toEqual(['Started 12:00 PM']);
  });

  it('can be started again from now', async () => {
    await startSquats();
    await wait(minutes(20));
    await press('Edit workout times');
    await press('Start the clock again from now');
    // MM-447: it cannot be taken back, so it asks first.
    const asked = await screen.findByRole('dialog', { name: 'Start the clock again from now?' });
    await user.click(within(asked).getByRole('button', { name: 'Start again' }));
    await settle();
    const workout = await only();
    expect(workout.startedAt).toEqual(after(minutes(20)));
    expect(workout.inProgress).toBe(true);
  });

  it('is not started again when the question is turned down (MM-447)', async () => {
    await startSquats();
    await wait(minutes(20));
    await press('Edit workout times');
    await press('Start the clock again from now');
    const asked = await screen.findByRole('dialog', { name: 'Start the clock again from now?' });
    await user.click(within(asked).getByRole('button', { name: 'Cancel' }));
    await settle();
    expect((await only()).startedAt).toEqual(noon);
  });

  it('names the times it edits as the workout’s (MM-447)', async () => {
    await startSquats();
    expect(layer().getByRole('button', { name: 'Edit workout times' })).toBeInTheDocument();
    expect(layer().queryByRole('button', { name: 'Edit times' })).not.toBeInTheDocument();
  });

  it('a finished workout shows when it was and how long', async () => {
    await saveFinished();
    await openFinished();
    expect(elapsed()).toBe('50:00');
    expect(clockLines()).toEqual(['6:00 PM to 6:50 PM']);
    // Nothing to time in a finished workout.
    expect(document.querySelector('.train-timer')).toBeNull();
  });
});

describe('pausing the workout clock', () => {
  it('stops it, and resuming carries on from where it was', async () => {
    await startSquats();
    await wait(minutes(10));
    await press('Pause');
    expect(clockLines()).toEqual(['Paused']);
    await wait(minutes(5));
    expect(elapsed()).toBe('10:00');
    expect(layer().getByLabelText(/^Workout time 10 minutes/)).toBeInTheDocument();
    // Resume is on the timer bar only (MM-447 review): the clock card says "Paused" and offers no second Resume.
    expect(layer().getAllByRole('button', { name: 'Resume' })).toHaveLength(1);
    expect(layer().queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
    await user.click(layer().getByRole('button', { name: 'Resume' }));
    await settle();
    expect(clockLines()).toEqual(['Started 12:00 PM']);
    await wait(minutes(2));
    expect(elapsed()).toBe('12:00');
    const workout = await only();
    expect(workout.paused).toBe(false);
    expect(workout.pausedForMs).toBe(minutes(5));
  });

  it('holds the set timer, and drops a set being timed', async () => {
    await startSquats();
    await pressTimer();
    await wait(seconds(20));
    await press('Pause');
    expect(timerLabel()).toBe('Paused');
    expect((await only()).setStartedAt).toBeUndefined();
    // MM-447: the screen says the set's timing was dropped, and the bar names the control that resumes.
    expect(await screen.findByText(/The set being timed was dropped/)).toBeInTheDocument();
    const bar = document.querySelector('.train-timer') as HTMLElement;
    expect(within(bar).getByText('Tap Resume to start the clock again.')).toBeInTheDocument();
    expect(timerButton()).toHaveAccessibleName('Resume');
    expect(timerButton()).toBeEnabled();
    // No figure while paused: a 0:00 would read as a reset (MM-447 review).
    expect(timerTime()).toBeUndefined();
    await pressTimer();
    expect((await only()).paused).toBe(false);
    expect(within(bar).getByRole('button', { name: 'Start set' })).toBeEnabled();
  });

  it('says nothing was dropped when no set was being timed (MM-447)', async () => {
    await startSquats();
    await press('Pause');
    expect(screen.queryByText(/The set being timed was dropped/)).not.toBeInTheDocument();
    expect(timerButton()).toHaveAccessibleName('Resume');
  });

  it('survives the app closing', async () => {
    const view = await open();
    await startWorkout(user);
    await choose('Back squat', undefined, user);
    await wait(minutes(10));
    await press('Pause');
    view.unmount();
    const later = clock;
    later.elapseMs(minutes(60));
    renderApp(repos, today, { clock: later });
    await openTrain();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await layer().findByRole('heading', { name: 'Back squat' });
    expect(clockLines()).toEqual(['Paused']);
    expect(elapsed()).toBe('10:00');
  });

  it('is left out of the length of a finished workout', async () => {
    await startSquats();
    await add();
    await typeInSet('Reps', '8', 1, user);
    await settle();
    await wait(minutes(30));
    await press('Pause');
    await wait(minutes(10));
    // Finished while still paused: the pause ends with the workout.
    await press('Finish workout');
    const workout = await only();
    expect(workout.paused).toBe(false);
    expect(workout.pausedForMs).toBe(minutes(10));
    expect(workout.endedAt).toEqual(after(minutes(40)));
    expect(await screen.findByText('1 exercise · 1 set · 30 min')).toBeInTheDocument();
    await user.click(workoutRows()[0] as HTMLElement);
    await layer().findByRole('heading', { name: 'Back squat' });
    expect(elapsed()).toBe('30:00');
    expect(clockLines()).toContain('Paused for 10:00');
    expect(layer().queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
  });
});

describe('a workout’s times, by hand', () => {
  async function openTimes(): Promise<void> {
    await saveFinished();
    await openFinished();
    await press('Edit workout times');
    await layer().findByRole('heading', { name: 'Workout times' });
  }

  it('the end can be changed', async () => {
    await openTimes();
    await press(/^Ended/);
    await enterTime('Ended', '19:15');
    const workout = await only();
    expect(workout.endedAt).toEqual(new Date(2026, 9, 4, 19, 15));
    expect(workout.startedAt).toEqual(new Date(2026, 9, 4, 18));
    expect(layer().getByRole('button', { name: /^Ended/ })).toHaveTextContent('7:15:00 PM');
  });

  it('the start can be changed', async () => {
    await openTimes();
    await press(/^Started/);
    await enterTime('Started', '17:30');
    const workout = await only();
    expect(workout.startedAt).toEqual(new Date(2026, 9, 4, 17, 30));
    expect(workout.endedAt).toEqual(new Date(2026, 9, 4, 18, 50));
  });

  it('an end before the start is refused, with the reason', async () => {
    await openTimes();
    await press(/^Ended/);
    await enterTime('Ended', '17:00');
    expect(screen.getByText('The end has to be after the start.')).toBeInTheDocument();
    expect((await only()).endedAt).toEqual(new Date(2026, 9, 4, 18, 50));
    // MM-222: refused inside the clock, which stays open on what was chosen.
    expect(screen.getByRole('dialog', { name: 'Ended' })).toBeInTheDocument();
  });

  it('a start and an end can be typed to the second', async () => {
    await openTimes();
    await press(/^Ended/);
    await enterClock(7, 15, 42, { period: 'PM', title: 'Ended' });
    await press(/^Started/);
    await enterClock(5, 30, 9, { period: 'PM', title: 'Started' });
    const workout = await only();
    expect(workout.startedAt).toEqual(new Date(2026, 9, 4, 17, 30, 9));
    expect(workout.endedAt).toEqual(new Date(2026, 9, 4, 19, 15, 42));
    expect(layer().getByRole('button', { name: /^Started/ })).toHaveTextContent('5:30:09 PM');
    expect(layer().getByRole('button', { name: /^Ended/ })).toHaveTextContent('7:15:42 PM');
  });

  it('the day moves both times with it', async () => {
    await openTimes();
    await press(/^Day/);
    await enterDate('2026-10-02');
    const workout = await only();
    expect(workout.date).toBe(CalendarDate.of(2026, 10, 2));
    expect(workout.startedAt).toEqual(new Date(2026, 9, 2, 18));
    expect(workout.endedAt).toEqual(new Date(2026, 9, 2, 18, 50));
  });
});

describe('the set timer', () => {
  it('times a set from Start set to Add set', async () => {
    await startSquats();
    expect(timerLabel()).toBe('Set timer');
    await wait(minutes(3));
    await pressTimer();
    expect(timerLabel()).toBe('Set');
    await wait(seconds(40));
    expect(timerTime()).toBe('0:40');
    await add();
    const workout = await only();
    const set = workout.exercises[0]?.sets[0];
    expect(set?.startedAt).toEqual(after(minutes(3)));
    expect(set?.durationMs).toBe(seconds(40));
    expect(workout.setStartedAt).toBeUndefined();
  });

  it('MM-222: ends a set from the bar, on the exercise it names', async () => {
    await startSquats();
    await pressTimer();
    await wait(seconds(40));
    const bar = document.querySelector('.train-timer') as HTMLElement;
    expect(within(bar).getByText('Tap Set done to record it on Back squat.')).toBeInTheDocument();
    await user.click(within(bar).getByRole('button', { name: 'Set done' }));
    await settle();
    const set = await onlySet();
    expect(set?.startedAt).toEqual(after(minutes(0)));
    expect(set?.durationMs).toBe(seconds(40));
    expect(timerLabel()).toBe('Rest');
    // The set's controls open, with how long it took beside its times.
    expect(within(setEditor()).getByText(/took 0:40$/)).toBeInTheDocument();
  });

  it('then counts the rest until the next set starts', async () => {
    await startSquats();
    await pressTimer();
    await wait(seconds(30));
    await add();
    expect(timerLabel()).toBe('Rest');
    await wait(seconds(90));
    expect(timerTime()).toBe('1:30');
    await pressTimer();
    expect(timerLabel()).toBe('Set');
    expect(timerTime()).toBe('0:00');
  });

  it('a set logged without it has an end and no start', async () => {
    await startSquats();
    await wait(minutes(4));
    await add();
    const set = await onlySet();
    expect(set?.startedAt).toBeUndefined();
    expect(set?.endedAt).toEqual(after(minutes(4)));
    // The rest still counts from it.
    expect(timerLabel()).toBe('Rest');
  });

  it('can be cancelled without logging a set', async () => {
    await startSquats();
    await pressTimer();
    await pressTimer();
    const workout = await only();
    expect(workout.setStartedAt).toBeUndefined();
    expect(workout.setCount).toBe(0);
    expect(timerLabel()).toBe('Set timer');
  });

  it('and the rest both survive the app closing', async () => {
    const view = await open();
    await startWorkout(user);
    await choose('Back squat', undefined, user);
    await add();
    await wait(seconds(20));
    await pressTimer();
    view.unmount();
    clock.elapseMs(minutes(1));
    renderApp(repos, today, { clock });
    await openTrain();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await layer().findByRole('heading', { name: 'Back squat' });
    expect(timerLabel()).toBe('Set');
    expect(timerTime()).toBe('1:00');
  });

  it('a set added to a finished workout gets no times', async () => {
    await saveFinished();
    await openFinished();
    await add();
    const sets = (await only()).exercises[0]?.sets ?? [];
    expect(sets).toHaveLength(2);
    expect(sets[1]?.startedAt).toBeUndefined();
    expect(sets[1]?.endedAt).toBeUndefined();
  });
});

describe('a set’s times, by hand', () => {
  // MM-222: a clash names the set it is with.
  const overlaps = 'That overlaps set 1 of Back squat.';

  it('MM-196 checks partial times against other sets of the same exercise', async () => {
    const first = new WorkoutSet({ reps: 8, loadKg: 100, startedAt: after(minutes(2)), endedAt: after(minutes(4)) });
    await repos.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: today,
        startedAt: noon,
        endedAt: after(minutes(10)),
        exercises: [
          new WorkoutExercise({ exerciseId: 'back-squat', sets: [first, new WorkoutSet({ reps: 8, loadKg: 100 })] }),
        ],
      }),
    );
    await openFinished();
    clock.elapseMs(minutes(10));
    await press(/Set 2$/);
    await pressInSet(/^Ended/, 2, user);
    await enterClock(12, 3);
    expect(screen.getByText(overlaps)).toBeInTheDocument();
    let sets = (await only()).exercises[0]?.sets ?? [];
    expect(sets[0]).toEqual(first);
    expect(sets[1]?.startedAt).toBeUndefined();
    expect(sets[1]?.endedAt).toBeUndefined();

    // MM-222: the refused time stays on the clock, which stays open to correct it.
    await enterClock(12, 4);
    sets = (await only()).exercises[0]?.sets ?? [];
    expect(sets[1]?.startedAt).toBeUndefined();
    expect(sets[1]?.endedAt).toEqual(after(minutes(4)));
  });

  it('MM-196 refuses overlapping typed times across exercises', async () => {
    const first = new WorkoutSet({ reps: 8, loadKg: 100, startedAt: after(minutes(2)), endedAt: after(minutes(3)) });
    const second = new WorkoutSet({ reps: 6, loadKg: 0, endedAt: after(minutes(4)) });
    await repos.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: today,
        startedAt: noon,
        endedAt: after(minutes(5)),
        exercises: [
          new WorkoutExercise({ exerciseId: 'back-squat', sets: [first] }),
          new WorkoutExercise({ exerciseId: 'pull-up', sets: [second] }),
        ],
      }),
    );
    await openFinished();
    clock.elapseMs(minutes(10));
    const pullUps = layer().getByRole('heading', { name: 'Pull-up' }).closest('.mm-surface') as HTMLElement;
    await user.click(within(pullUps).getByRole('button', { name: /Set 1/ }));
    await pressInSet(/^Started/, 1, user);
    await enterClock(12, 2);
    expect(screen.getByText(overlaps)).toBeInTheDocument();
    let workout = await only();
    expect(workout.exercises[1]?.sets[0]).toEqual(second);
    expect(workout.exercises[0]?.sets[0]).toEqual(first);

    // A shared boundary is valid, and the edited set excludes itself; the
    // clock stays open on the refused time to correct it (MM-222).
    await enterClock(12, 3);
    workout = await only();
    expect(workout.exercises[1]?.sets[0]?.startedAt).toEqual(after(minutes(3)));
    await pressInSet(/^Ended/, 1, user);
    await enterClock(12, 5);
    workout = await only();
    expect(workout.exercises[1]?.sets[0]?.endedAt).toEqual(after(minutes(5)));
  });

  it('a start can be typed', async () => {
    await startSquats();
    await wait(minutes(10));
    await add();
    expect(within(setEditor()).getByText('Not timed')).toBeInTheDocument();
    await pressInSet(/^Started/, 1, user);
    await enterClock(12, 9);
    const set = await onlySet();
    expect(set?.startedAt).toEqual(after(minutes(9)));
    expect(set?.endedAt).toEqual(after(minutes(10)));
  });

  it('a start after the end is refused, with the reason', async () => {
    await startSquats();
    await wait(minutes(10));
    await add();
    await wait(minutes(10));
    await pressInSet(/^Started/, 1, user);
    await enterClock(12, 15);
    expect(screen.getByText('The end has to be after the start.')).toBeInTheDocument();
    expect((await onlySet())?.startedAt).toBeUndefined();
  });

  it('a time before the workout began is refused', async () => {
    await startSquats();
    await wait(minutes(10));
    await add();
    await pressInSet(/^Started/, 1, user);
    await enterClock(11, 50, 0, { period: 'AM' });
    expect(screen.getByText('That is before the workout started.')).toBeInTheDocument();
    expect((await onlySet())?.startedAt).toBeUndefined();
  });
});
