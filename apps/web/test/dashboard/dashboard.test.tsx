import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';

/** The Dashboard. Carried over from dashboard_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

const targets = (from: CalendarDate, kcal: number) =>
  new TargetsRecord({
    effectiveFrom: from,
    mode: 'fatLoss',
    tdeeKcal: 2700,
    tdeeSigmaKcal: 400,
    tdeeStatus: 'held',
    targets: new DailyTargets({ kcal, proteinG: 170, fatG: 70, carbsG: 250, weeklyRateFraction: -0.0075 }),
  });

const food = (name: string, kcal: number, protein: number) =>
  new FoodEntry({
    id: 0,
    date: today,
    meal: 'lunch',
    name,
    kcal,
    proteinG: protein,
    carbsG: 40,
    fatG: 10,
    source: 'weighed',
  });

async function seed({
  onboardedDaysAgo = 45,
  weighedToday = true,
  history = [],
  foods = [],
}: {
  onboardedDaysAgo?: number;
  weighedToday?: boolean;
  history?: readonly TargetsRecord[];
  foods?: readonly FoodEntry[];
} = {}): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-onboardedDaysAgo) }));
  for (let d = 7; d >= (weighedToday ? 0 : 1); d--) await repos.weights.saveWeight(today.addDays(-d), 82 + d * 0.05);
  for (const record of history) await repos.targets.saveTargets(record);
  for (const entry of foods) await repos.food.addFood(entry);
}

it('the app opens on the dashboard with its destinations', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  const bar = await screen.findByRole('navigation', { name: 'Destinations' });
  for (const label of ['Dashboard', 'Food', 'Progress', 'Coach']) expect(bar).toHaveTextContent(label);
  expect(await screen.findByText(/kcal left/)).toBeInTheDocument();
});

it('a normal day shows calories, protein and the trend weight', async () => {
  await seed({
    history: [targets(today.addDays(-30), 2400)],
    foods: [food('Lunch', 700, 45), food('Dinner', 700, 50)],
  });
  renderApp(repos, today);
  expect(await screen.findByText('kcal left of 2,400')).toBeInTheDocument();
  expect(screen.getByText('1,000')).toBeInTheDocument();
  expect(screen.getByText('95 / 170 g')).toBeInTheDocument();
  expect(screen.getByText('Trend weight')).toBeInTheDocument();
  expect(screen.getByText('Last 7 days')).toBeInTheDocument();
});

it('with no weigh-in today the weight card asks for one', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  // Once saved, the card shows the trend and no longer asks.
  expect(await screen.findByText('Trend weight')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Today’s weigh-in' })).not.toBeInTheDocument();
  const weights = await first(repos.weights.watchWeights());
  const last = weights[weights.length - 1];
  expect(last?.date).toBe(today);
  expectClose(last?.weightKg ?? 0, 82.28, 0.01);
});

it('during calibration the coach line says which day', async () => {
  await seed({ onboardedDaysAgo: 5, history: [targets(today.addDays(-5), 2400)] });
  renderApp(repos, today);
  expect(await screen.findByText(/Calibration, day 6 of 14/)).toBeInTheDocument();
});

it('after a check-in the coach line says what changed', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400), targets(today.addDays(-2), 2320)] });
  renderApp(repos, today);
  expect(await screen.findByText(/Targets went down about 80 kcal/)).toBeInTheDocument();
});

it('pressing the intake figure opens the Food destination', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  const view = renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Open today’s food' }));
  expect(view.container.querySelector('[aria-current="page"]')).toHaveTextContent('Food');
});

it('pressing the coach line opens the Coach destination', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400), targets(today.addDays(-2), 2320)] });
  renderApp(repos, today);
  await userEvent.click(await screen.findByText(/Targets went down about 80 kcal/));
  expect(await screen.findByRole('heading', { name: 'Your targets' })).toBeInTheDocument();
});
