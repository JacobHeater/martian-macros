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
  // The weight row (MM-254, MM-298): the trend names itself; today's entry and the week beneath.
  expect(screen.getByText(/^Trend [\d.]+ (lb|kg)$/)).toBeInTheDocument();
  expect(screen.getByText(/^Today [\d.]+ (lb|kg) · 7 days /)).toBeInTheDocument();
});

it('with no weigh-in today the weight card asks for one', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  // Once saved, the weight row shows the trend and no longer asks.
  expect(await screen.findByText(/^Trend [\d.]+ (lb|kg)$/)).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Today’s weigh-in' })).not.toBeInTheDocument();
  const weights = await first(repos.weights.watchWeights());
  const last = weights[weights.length - 1];
  expect(last?.date).toBe(today);
  expectClose(last?.weightKg ?? 0, 82.28, 0.01);
});

// MM-291: the weigh-in asks in the slot the answer takes, inside the card, never bare on the canvas.
it('asks for the weigh-in in the first row of the list group, and answers in the same slot', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  const field = await screen.findByRole('textbox', { name: 'Today’s weigh-in' });
  const group = field.closest('.mm-list-group');
  expect(group).not.toBeNull();
  expect(group?.firstElementChild?.contains(field)).toBe(true);
  expect(group).toHaveTextContent('No waist measurement yet');
  await userEvent.type(field, '181.4{Enter}');
  const trend = await screen.findByText(/^Trend [\d.]+ (lb|kg)$/);
  expect(group?.firstElementChild?.contains(trend)).toBe(true);
});

// MM-294: a save that removes the field says so, aloud, with the number typed.
it('says the weigh-in was saved, with the number typed', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Saved 181.4 lb for today');
});

// MM-298: the trend before the weigh-in; the trend named, with today's entry, after it.
it('says the trend so far before the weigh-in, and today beside the trend after it', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  const field = await screen.findByRole('textbox', { name: 'Today’s weigh-in' });
  const row = field.closest('.mm-list-row') as HTMLElement;
  expect(row).toHaveTextContent(/Trend so far [\d.]+ lb/);
  await userEvent.type(field, '181.4{Enter}');
  expect(await screen.findByText(/^Today 181\.4 lb · 7 days [−+]/)).toBeInTheDocument();
  expect(screen.getByText(/^Trend [\d.]+ (lb|kg)$/)).toBeInTheDocument();
  expect(screen.queryByText(/^Trend ·/)).not.toBeInTheDocument();
});

// MM-298, UX-2: the first weigh-in is shown once, never as a trend of itself and never with a bare dash.
it('shows the first weigh-in once and says the trend starts tomorrow', async () => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today }));
  await repos.weights.saveWeight(today, 82);
  renderApp(repos, today);
  expect(await screen.findByText('Today’s weigh-in · the trend starts tomorrow')).toBeInTheDocument();
  expect(screen.getByText('180.8 lb')).toBeInTheDocument();
  expect(screen.queryByText(/^Trend /)).not.toBeInTheDocument();
  expect(screen.queryByText(/—/)).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Today’s weigh-in' })).not.toBeInTheDocument();
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
