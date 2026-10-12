import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { UnitSystem } from '../../src/domain/UnitSystem';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { workoutOn } from '../support/workoutOn';

/** MM-32: the recomp signal card on Progress. Carried over from recomp_signal_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function setUpUser(units: UnitSystem = 'metric'): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-60), goalMode: 'recomp', healthCheckConfirmedOn: today }).copyWith({
      unitSystem: units,
    }),
  );
}

beforeEach(() => setUpUser());

/** Six weeks of daily weigh-ins from `fromKg` to `toKg`. */
async function weighed(fromKg: number, toKg: number): Promise<void> {
  for (let d = 42; d >= 0; d--) {
    await repos.weights.saveWeight(
      today.addDays(-d),
      fromKg + ((toKg - fromKg) * (42 - d)) / 42 + (d % 2 === 0 ? 0.2 : -0.2),
    );
  }
}

async function waist(byDaysAgo: Readonly<Record<number, number>>): Promise<void> {
  for (const [ago, cm] of Object.entries(byDaysAgo)) await repos.waist.saveWaist(today.addDays(-Number(ago)), cm);
}

const down = { 30: 92, 24: 92, 10: 90, 3: 90 };

/** Six weekly sessions of squat and row, the last yesterday, each a little heavier when `rising`. */
async function trained({ rising = true }: { rising?: boolean } = {}): Promise<void> {
  for (let week = 5; week >= 0; week--) {
    const more = rising ? (5 - week) * 2.5 : 0.0;
    await repos.workouts.saveWorkout(
      workoutOn(today.addDays(-1 - week * 7), [
        ['back-squat', 6, 100 + more],
        ['barbell-row', 6, 60 + more],
      ]),
    );
  }
}

async function openProgress(): Promise<void> {
  renderApp(repos, today);
  await openTab('Progress');
  await screen.findByRole('heading', { name: 'Strength trends' });
}

const card = () => screen.queryByRole('heading', { name: /recomp signal$/i })?.closest('.mm-surface') ?? null;
const cardText = () => card()?.querySelector('.app-text')?.textContent ?? '';

it('weight flat, waist down, two lifts up: the signal is shown', async () => {
  await weighed(82, 82);
  await waist(down);
  await trained();
  await openProgress();

  expect(screen.getByRole('heading', { name: 'Recomp signal' })).toBeInTheDocument();
  const text = cardText();
  expect(text).toContain('Trend weight held near 82.0 kg.');
  expect(text).toContain('Waist down about 2 cm.');
  expect(text).toContain('Estimated maxes are up on ');
  expect(text).toContain('back squat');
  expect(text).toContain('barbell row');
  expect(text).toContain('It does not measure either.');
  expect(text).not.toContain('gained muscle');
});

it('a waist change is shown to the quarter inch', async () => {
  await setUpUser('imperial');
  await weighed(82, 82);
  await waist(down);
  await trained();
  await openProgress();

  expect(cardText()).toContain('Waist down about 0.75 in.');
});

it('with no waist logged it asks for a weekly measurement', async () => {
  await weighed(82, 82);
  await trained();
  await openProgress();

  expect(screen.getByRole('heading', { name: 'Close to a recomp signal' })).toBeInTheDocument();
  expect(cardText()).toBe(
    'Your trend weight is holding and your lifts are going up. Measure ' +
      'your waist once a week to see whether it is coming down too.',
  );
});

it('with no training logged it asks for that', async () => {
  await weighed(82, 82);
  await waist(down);
  await openProgress();

  expect(cardText()).toContain('Log your training');
});

it('falling weight is fat loss: no card', async () => {
  await weighed(84, 81.5);
  await waist(down);
  await trained();
  await openProgress();

  expect(card()).toBeNull();
});

it('a waist that went up is no card, not a prompt', async () => {
  await weighed(82, 82);
  await waist({ 30: 90, 24: 90, 10: 92, 3: 92 });
  await trained();
  await openProgress();

  expect(card()).toBeNull();
});

it('lifts that did not go up are no card', async () => {
  await weighed(82, 82);
  await waist(down);
  await trained({ rising: false });
  await openProgress();

  expect(card()).toBeNull();
});
