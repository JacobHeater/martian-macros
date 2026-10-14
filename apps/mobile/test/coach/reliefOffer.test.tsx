import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { paceLabel } from '../../src/format/paceLabel';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { dashboardLoaded } from '../support/dashboardLoaded';

/** MM-117: an offer to ease a deficit when recovery is failing. Carried over from relief_offer_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function seed({ goal = 'fatLoss', hardWeeks = 2 }: { goal?: GoalMode; hardWeeks?: number } = {}): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ goalMode: goal, onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-3), {
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
  expect(screen.getByRole('button', { name: 'Take a maintenance week' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Slow to 0.5% a week' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Carry on' })).toBeInTheDocument();
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

it('a maintenance week puts targets at maintenance at once', async () => {
  await seed();
  const before = await open();
  await userEvent.click(screen.getByRole('button', { name: 'Take a maintenance week' }));
  await expect.poll(offer).toBeNull();
  expect((await repos.setup.loadSetup())?.maintenanceWeekFrom).toBe(today);
  await expect.poll(async () => (await history()).length).toBe(before.length + 1);
  const now = await history();
  const last = now[now.length - 1];
  expect(last?.effectiveFrom).toBe(today);
  expect(last?.targets.flags.has('requestedBreak')).toBe(true);
  expect(last?.targets.weeklyRateFraction).toBe(0);
  expect(last?.targets.kcal ?? 0).toBeGreaterThan(before[before.length - 1]?.targets.kcal ?? 0);
});

it('a slower pace is stored, and never a lower target', async () => {
  await seed();
  const before = await open();
  await userEvent.click(screen.getByRole('button', { name: 'Slow to 0.5% a week' }));
  await expect.poll(offer).toBeNull();
  const after = await repos.setup.loadSetup();
  expect(after?.requestedLossFraction).toBe(0.005);
  expect(after?.reliefAnsweredOn).toBe(today);
  const now = await history();
  expect(now[now.length - 1]?.targets.kcal ?? 0).toBeGreaterThanOrEqual(before[before.length - 1]?.targets.kcal ?? 0);
});
