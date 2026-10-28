import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { GoalMode } from '../../src/domain/GoalMode';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-128: the pace of fat loss is chosen on the Coach tab, with what each costs, and acts at once. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

async function seed({ goal = 'fatLoss', kcal = 2200 }: { goal?: GoalMode; kcal?: number } = {}): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today, goalMode: goal }));
  for (let d = 30; d >= 0; d--) {
    const date = today.addDays(-d);
    await repos.weights.saveWeight(date, 90 - d * 0.03);
    await repos.food.addFood(foodOn(date, { name: `Day ${d}`, meal: 'lunch', kcal: 2300, proteinG: 160, carbsG: 250, fatG: 70 }));
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  // Targets three days old, so no weekly check-in is due: what changes today is the pace alone.
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-3), { kcal, proteinG: 160, tdeeKcal: 2900, mode: goal, weeklyRateFraction: goal === 'fatLoss' ? -0.0075 : 0 }),
  );
}

const history = () => first(repos.targets.watchTargetsHistory());

it('the Coach shows the pace in force and opens the three paces with what each costs today', async () => {
  await seed();
  renderApp(repos, today);
  await openCoach();
  expect(await screen.findByText('Standard')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Change pace' }));
  const sheet = await screen.findByRole('dialog', { name: 'Choose a pace' });
  expect(within(sheet).getByRole('button', { name: /^Gentle · 0\.5% a week · about/ })).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: /^Standard · 0\.75% a week/ })).toBeInTheDocument();
  expect(within(sheet).getAllByText(/kcal a day under your expenditure, for a target of/).length).toBeGreaterThanOrEqual(2);
  // The default is marked, and each offered pace says what it is like to live on.
  expect(within(sheet).getByText('Default')).toBeInTheDocument();
  expect(within(sheet).getByText(/Slow and steady/)).toBeInTheDocument();
});

it('choosing a pace stores it and the targets change at once, without a step limit', async () => {
  await seed({ kcal: 2200 });
  renderApp(repos, today);
  await openCoach();
  await userEvent.click(await screen.findByRole('button', { name: 'Change pace' }));
  const sheet = await screen.findByRole('dialog', { name: 'Choose a pace' });
  await userEvent.click(within(sheet).getByRole('button', { name: /^Gentle/ }));
  await expect.poll(async () => (await repos.setup.loadSetup())?.requestedLossFraction).toBe(0.005);
  expect((await repos.setup.loadSetup())?.paceChangedOn).toBe(today);
  await expect.poll(async () => (await history()).length).toBe(2);
  const [before, after] = await history();
  expect(after?.effectiveFrom).toBe(today);
  // A gentler pace means more calories, and the whole difference now (the weekly step limit is 100 kcal), built on
  // the same estimate of expenditure the targets rested on: only the pace moved.
  expect((after?.targets.kcal ?? 0) - (before?.targets.kcal ?? 0)).toBeGreaterThan(100);
  expect(after?.tdeeKcal).toBe(before?.tdeeKcal);
  expect(after?.requestedLossFraction).toBe(0.005);
  expect(after?.explanation?.lines.some((l) => l.reason === 'paceChange')).toBe(true);
  expect(await screen.findByText(/Pace set to Gentle/)).toBeInTheDocument();
});

it('recomp has no pace control', async () => {
  await seed({ goal: 'recomp', kcal: 2700 });
  renderApp(repos, today);
  await openCoach();
  await screen.findByText('Recomp', { selector: '.mm-section-summary' });
  expect(screen.queryByRole('button', { name: 'Change pace' })).not.toBeInTheDocument();
});

it('a pace the coach will not run is listed with its reason and cannot be chosen', async () => {
  // At 18% body fat Faster is withheld (not clearly high body fat).
  await seed();
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }).copyWith({ bodyFatPercent: 18 }),
  );
  renderApp(repos, today);
  await openCoach();
  await userEvent.click(await screen.findByRole('button', { name: 'Change pace' }));
  const sheet = await screen.findByRole('dialog', { name: 'Choose a pace' });
  expect(within(sheet).queryByRole('button', { name: /^Faster/ })).not.toBeInTheDocument();
  expect(within(sheet).getByText(/^Faster · 1% a week/)).toBeInTheDocument();
  expect(within(sheet).getByText(/Not offered: faster loss is for clearly high body fat/)).toBeInTheDocument();
});
