import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { Pause } from '../../src/domain/Pause';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { workoutOn } from '../support/workoutOn';

/** MM-134: a goal that needs training says so, and notices when training stops. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function seed({
  goal,
  trainingDays = 3,
  lastWorkoutDaysAgo,
  targetsDaysAgo = 30,
}: { goal: GoalMode; trainingDays?: number; lastWorkoutDaysAgo?: number; targetsDaysAgo?: number }): Promise<void> {
  const setup = typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today, goalMode: goal }).copyWith({ trainingDaysPerWeek: trainingDays });
  await repos.setup.saveSetup(setup);
  for (let d = 60; d >= 0; d--) {
    const date = today.addDays(-d);
    await repos.weights.saveWeight(date, 80 + (d % 2) * 0.1);
    await repos.food.addFood(foodOn(date, { name: `Day ${d}`, meal: 'lunch', kcal: 2700, proteinG: 160, carbsG: 300, fatG: 80 }));
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  if (lastWorkoutDaysAgo !== undefined) {
    for (const daysAgo of [lastWorkoutDaysAgo + 21, lastWorkoutDaysAgo + 14, lastWorkoutDaysAgo + 7, lastWorkoutDaysAgo]) {
      await repos.workouts.saveWorkout(workoutOn(today.addDays(-daysAgo), [['back-squat', 5, 100]]));
    }
  }
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-targetsDaysAgo), {
      kcal: goal === 'leanGain' ? 2900 : 2300,
      mode: goal,
      weeklyRateFraction: goal === 'leanGain' ? 0.0025 : -0.0075,
      tdeeKcal: 2700,
      tdeeStatus: 'updated',
    }),
  );
}

const history = () => first(repos.targets.watchTargetsHistory());

it('choosing lean gain without training shows the note and needs one acknowledgement', async () => {
  await seed({ goal: 'fatLoss', trainingDays: 0, targetsDaysAgo: 3 });
  renderApp(repos, today);
  await openTab('Coach');
  await userEvent.click(await screen.findByRole('button', { name: 'Change goal' }));
  const sheet = await screen.findByRole('dialog', { name: 'Choose a goal' });
  expect(within(sheet).getAllByText(/This goal works through resistance training. Without it, a surplus is stored as fat./).length).toBe(2);
  expect(within(sheet).getByText(/Training here means working each major muscle group/)).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Lean gain/ }));
  const ask = await screen.findByRole('dialog', { name: 'Lean gain without training' });
  await userEvent.click(within(ask).getByRole('button', { name: 'Not now' }));
  expect((await repos.setup.loadSetup())?.goalMode).toBe('fatLoss');
  await userEvent.click(screen.getByRole('button', { name: 'Change goal' }));
  await userEvent.click(within(await screen.findByRole('dialog', { name: 'Choose a goal' })).getByRole('button', { name: /^Lean gain/ }));
  await userEvent.click(within(await screen.findByRole('dialog', { name: 'Lean gain without training' })).getByRole('button', { name: 'I understand, choose Lean gain' }));
  await expect.poll(async () => (await repos.setup.loadSetup())?.goalMode).toBe('leanGain');
});

it('recomp without training shows the note and needs no acknowledgement', async () => {
  await seed({ goal: 'leanGain', trainingDays: 0, targetsDaysAgo: 3 });
  renderApp(repos, today);
  await openTab('Coach');
  await userEvent.click(await screen.findByRole('button', { name: 'Change goal' }));
  const sheet = await screen.findByRole('dialog', { name: 'Choose a goal' });
  await userEvent.click(within(sheet).getByRole('button', { name: /^Recomp/ }));
  // A deficit goes through the health recheck; no acknowledgement dialog stands in the way.
  expect(screen.queryByRole('dialog', { name: 'Lean gain without training' })).not.toBeInTheDocument();
});

it('training lapses on a gain: targets go to maintenance at the check-in, flagged, with the reason; a workout brings them back', async () => {
  await seed({ goal: 'leanGain', lastWorkoutDaysAgo: 25, targetsDaysAgo: 7 });
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText('The surplus is paused')).toBeInTheDocument();
  await expect.poll(async () => (await history()).length).toBe(2);
  const last = (await history())[1];
  expect(last?.targets.flags.has('trainingLapsed')).toBe(true);
  expect(last?.targets.weeklyRateFraction).toBe(0);
  expect(last?.targets.kcal).toBeLessThan(2900);
  expect(await screen.findByText(/The surplus is paused: no workout has been logged for three weeks/)).toBeInTheDocument();
});

it('between two and three weeks on a gain it is a notice and the targets stand', async () => {
  await seed({ goal: 'leanGain', lastWorkoutDaysAgo: 16, targetsDaysAgo: 3 });
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText('Training is what the gain is for')).toBeInTheDocument();
  expect((await history()).length).toBe(1);
});

it('training lapses on a cut: a notice, and targets unchanged', async () => {
  await seed({ goal: 'fatLoss', lastWorkoutDaysAgo: 16, targetsDaysAgo: 3 });
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText('Lifting keeps the muscle')).toBeInTheDocument();
  expect(screen.getByText(/Lifting is what tells your body to keep muscle while you lose weight/)).toBeInTheDocument();
  expect((await history()).length).toBe(1);
});

it('paused: no notice, and the gain is suspended without comment', async () => {
  await seed({ goal: 'leanGain', lastWorkoutDaysAgo: 25, targetsDaysAgo: 7 });
  await repos.pauses.savePause(new Pause({ from: today.addDays(-2), to: today.addDays(5), reason: 'injury' }));
  renderApp(repos, today);
  await openTab('Coach');
  await screen.findByRole('heading', { name: /^Goal: Lean gain/ });
  expect(screen.queryByText('The surplus is paused')).not.toBeInTheDocument();
  expect(screen.queryByText('Training is what the gain is for')).not.toBeInTheDocument();
});

it('no training days set on a gain: the surplus pauses at once', async () => {
  await seed({ goal: 'leanGain', trainingDays: 0, targetsDaysAgo: 3 });
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText('The surplus is paused')).toBeInTheDocument();
  await expect.poll(async () => (await history()).length).toBe(2);
  expect((await history())[1]?.explanation?.lines.some((l) => l.reason === 'trainingLapse')).toBe(true);
});
