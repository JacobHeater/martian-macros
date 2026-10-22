import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { Fmt } from '../../src/format/Fmt';
import { paceLabel } from '../../src/format/paceLabel';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { dashboardLoaded } from '../support/dashboardLoaded';

/** MM-117: an offer to ease a deficit when recovery is failing. Carried over from relief_offer_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function seed({
  goal = 'fatLoss',
  hardWeeks = 2,
  deficitDays = 3,
}: { goal?: GoalMode; hardWeeks?: number; deficitDays?: number } = {}): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ goalMode: goal, onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-deficitDays), {
      mode: goal,
      kcal: 2000,
      proteinG: 160,
      carbsG: 200,
      tdeeKcal: 2600,
      tdeeSigmaKcal: 300,
      weeklyRateFraction: goal === 'leanGain' ? 0.0025 : -0.0075,
    }),
  );
  for (let week = 0; week < hardWeeks; week++) {
    await repos.recovery.saveRecoveryCheckIn(
      new RecoveryCheckIn({
        date: today.addDays(-1 - 7 * week),
        hunger: 1,
        energy: 2,
        sleep: 1,
        training: 4,
        mood: 3,
        sleepHours: 5.5,
      }),
    );
  }
}

const history = (): Promise<TargetsRecord[]> => first(repos.targets.watchTargetsHistory());
const offer = () => screen.queryByText('Two hard weeks in a row')?.closest('.mm-notice') ?? null;

/** The dashboard, once the check-in of this launch has settled. */
async function open(): Promise<TargetsRecord[]> {
  renderApp(repos, today);
  await dashboardLoaded();
  return history();
}

it('a pace reads as a percent a week', () => {
  expect(paceLabel(0.005)).toBe('0.5% a week');
  expect(paceLabel(0.0075)).toBe('0.75% a week');
  expect(paceLabel(0.01)).toBe('1% a week');
});

it('two hard weeks on a cut bring the offer, with its reasons', async () => {
  await seed();
  await open();
  expect(offer()).not.toBeNull();
  expect(offer()).toHaveTextContent('The coach would');
  expect(offer()).toHaveTextContent('appears to shift loss');
  expect(screen.getByRole('button', { name: /^Take a two-week break/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Slow to 0\.5% a week/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Carry on' })).toBeInTheDocument();
});

/** MM-128's names and costs: the slower pace is said as the pace choice says it. */
it('the slower pace is named, with what it costs', async () => {
  await seed();
  await open();
  expect(offer()).toHaveTextContent(
    /Gentle is 0\.5% a week: about [\d,]+ kcal a day under your expenditure, for a target of [\d,]+ kcal\./,
  );
});

/** MM-135: twelve unbroken weeks bring the offer with no recovery check-in answered, and without the slower pace. */
it('twelve weeks in a deficit bring the break offer, a break or carry on', async () => {
  await seed({ hardWeeks: 0, deficitDays: 90 });
  await open();
  expect(offer()).toBeNull();
  const long = screen.getByText('12 weeks in a deficit').closest('.mm-notice');
  expect(long).toHaveTextContent('at 20 weeks it plans a break itself');
  expect(long?.textContent?.toLowerCase()).not.toMatch(/metabol|good/);
  expect(screen.getByRole('button', { name: /^Take a two-week break/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^Slow to/ })).toBeNull();
  expect(screen.getByRole('button', { name: 'Carry on' })).toBeInTheDocument();
});

it('eleven weeks in a deficit bring nothing', async () => {
  await seed({ hardWeeks: 0, deficitDays: 83 });
  await open();
  expect(screen.queryByText(/weeks in a deficit$/)).toBeNull();
});

it('it never suggests eating less or moving more', async () => {
  await seed();
  await open();
  const all = (offer()?.textContent ?? '').toLowerCase();
  expect(all).not.toBe('');
  for (const phrase of [
    'eat less',
    'fewer calories',
    'cut calories',
    'cardio',
    'train more',
    'exercise',
    'push through',
    'try harder',
  ]) {
    expect(all, phrase).not.toContain(phrase);
  }
});

/** A finished workout `daysAgo`, five reps of the squat and the row at `loadKg`. */
function lifted(daysAgo: number, loadKg: number): Workout {
  const date = today.addDays(-daysAgo);
  const startedAt = new Date(date.year, date.month - 1, date.day, 18);
  return new Workout({
    id: 0,
    date,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 50 * 60 * 1000),
    exercises: ['back-squat', 'barbell-row'].map(
      (exerciseId) => new WorkoutExercise({ exerciseId, sets: [new WorkoutSet({ reps: 5, loadKg })] }),
    ),
  });
}

/** MM-117: the strength trigger, with no check-in answered. */
it('two lifts falling over three weeks on a cut bring the offer, and say a lighter week is a reason to carry on', async () => {
  await seed({ hardWeeks: 0 });
  for (const [daysAgo, kg] of [
    [28, 100],
    [21, 100],
    [14, 96],
    [7, 92],
    [1, 88],
  ] as const) {
    await repos.workouts.saveWorkout(lifted(daysAgo, kg));
  }
  await open();
  const card = screen.getByText('Your lifts are falling').closest('.mm-notice');
  expect(card).toHaveTextContent('back squat and barbell row');
  expect(card).toHaveTextContent('if that is it, carry on');
  expect(screen.getByRole('button', { name: /^Slow to 0\.5% a week/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Carry on' })).toBeInTheDocument();
});

it('one hard week brings nothing', async () => {
  await seed({ hardWeeks: 1 });
  await open();
  expect(offer()).toBeNull();
});

it('it is not made on lean gain', async () => {
  await seed({ goal: 'leanGain' });
  await open();
  expect(offer()).toBeNull();
});

it('Carry on changes nothing and the offer goes', async () => {
  await seed();
  const before = await open();
  await userEvent.click(screen.getByRole('button', { name: 'Carry on' }));
  await expect.poll(offer).toBeNull();
  const after = await repos.setup.loadSetup();
  expect(after?.reliefAnsweredOn).toBe(today);
  expect(after?.maintenanceWeekFrom).toBeUndefined();
  expect(after?.requestedLossFraction).toBeUndefined();
  const now = await history();
  expect(now).toHaveLength(before.length);
  expect(now[now.length - 1]?.targets.kcal).toBe(before[before.length - 1]?.targets.kcal);
});

it('a break puts targets at maintenance at once, for two weeks', async () => {
  await seed();
  const before = await open();
  await userEvent.click(screen.getByRole('button', { name: /^Take a two-week break/ }));
  await expect.poll(offer).toBeNull();
  expect((await repos.setup.loadSetup())?.maintenanceWeekFrom).toBe(today);
  await expect.poll(async () => (await history()).length).toBe(before.length + 1);
  const now = await history();
  const last = now[now.length - 1];
  expect(last?.effectiveFrom).toBe(today);
  expect(last?.targets.flags.has('requestedBreak')).toBe(true);
  expect(last?.targets.weeklyRateFraction).toBe(0);
  expect(last?.targets.kcal ?? 0).toBeGreaterThan(before[before.length - 1]?.targets.kcal ?? 0);
  // The dashboard's next check-in is the break's length away, not a week.
  expect(screen.getByText(Fmt.day(today.addDays(14), today))).toBeInTheDocument();
});

it('a slower pace is stored, and never a lower target', async () => {
  await seed();
  const before = await open();
  await userEvent.click(screen.getByRole('button', { name: /^Slow to 0\.5% a week/ }));
  await expect.poll(offer).toBeNull();
  const after = await repos.setup.loadSetup();
  expect(after?.requestedLossFraction).toBe(0.005);
  expect(after?.reliefAnsweredOn).toBe(today);
  const now = await history();
  expect(now[now.length - 1]?.targets.kcal ?? 0).toBeGreaterThanOrEqual(before[before.length - 1]?.targets.kcal ?? 0);
});

/** The panel's MM-117 review: on the Dashboard the offer must not take the screen's one primary. */
it('both choices are secondary, the coach’s suggestion first and heard as the suggestion', async () => {
  await seed();
  await open();
  const choices = within(offer() as HTMLElement)
    .getAllByRole('button')
    .filter((button) => /^(Slow to|Take a)/.test(button.textContent ?? ''));
  expect(choices.map((button) => button.textContent)).toEqual(['Slow to 0.5% a week', 'Take a two-week break']);
  for (const button of choices) expect(button).toHaveClass('mm-button-secondary');
  expect(choices[0]).toHaveAccessibleName('Slow to 0.5% a week, the coach’s suggestion');
  expect(choices[1]).toHaveAccessibleName('Take a two-week break');
});

it('on a long deficit the break comes first, as the suggestion', async () => {
  await seed({ hardWeeks: 0, deficitDays: 90 });
  await open();
  const button = screen.getByRole('button', { name: 'Take a two-week break, the coach’s suggestion' });
  expect(button).toHaveClass('mm-button-secondary');
});

it('a break is confirmed with the day it ends, and Undo that day puts the targets and the offer back', async () => {
  await seed();
  const before = await open();
  await userEvent.click(screen.getByRole('button', { name: /^Take a two-week break/ }));
  expect(await screen.findByText(`Break started: maintenance until ${Fmt.shortDay(today.addDays(14))}`)).toBeInTheDocument();
  await expect.poll(async () => (await history()).length).toBe(before.length + 1);
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await history()).length).toBe(before.length);
  const after = await repos.setup.loadSetup();
  expect(after?.maintenanceWeekFrom).toBeUndefined();
  expect(after?.reliefAnsweredOn).toBeUndefined();
  const now = await history();
  expect(now[now.length - 1]?.targets.kcal).toBe(before[before.length - 1]?.targets.kcal);
  await expect.poll(offer).not.toBeNull();
});

it('a slower pace is confirmed with the pace, and Undo that day puts the pace and the targets back', async () => {
  await seed();
  const before = await open();
  await userEvent.click(screen.getByRole('button', { name: /^Slow to 0\.5% a week/ }));
  expect(await screen.findByText('Pace slowed to 0.5% a week')).toBeInTheDocument();
  await expect.poll(async () => (await history()).length).toBe(before.length + 1);
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await repos.setup.loadSetup())?.requestedLossFraction).toBeUndefined();
  await expect.poll(async () => (await history()).length).toBe(before.length);
  const now = await history();
  expect(now[now.length - 1]?.targets.kcal).toBe(before[before.length - 1]?.targets.kcal);
  await expect.poll(offer).not.toBeNull();
});
