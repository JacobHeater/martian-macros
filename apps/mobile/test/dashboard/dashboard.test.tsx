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
import { ReminderRule } from '../../src/engine/ReminderRule';
import { Fmt } from '../../src/format/Fmt';
import { CardioSession } from '../../src/domain/training/CardioSession';

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
  expect(await screen.findByText('left of 2,400')).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: 'Menu' }));
  const drawer = await screen.findByRole('dialog', { name: 'Menu' });
  for (const label of ['Dashboard', 'Food', 'Train', 'Coach']) expect(drawer).toHaveTextContent(label);
  await userEvent.keyboard('{Escape}');
});

it('a normal day shows calories, protein and the trend weight', async () => {
  await seed({
    history: [targets(today.addDays(-30), 2400)],
    foods: [food('Lunch', 700, 45), food('Dinner', 700, 50)],
  });
  renderApp(repos, today);
  expect(await screen.findByText('left of 2,400')).toBeInTheDocument();
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
  await userEvent.click(screen.getByRole('button', { name: 'Save weigh-in' }));
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
  expect(group).toHaveTextContent('Next check-in');
  await userEvent.type(field, '181.4{Enter}');
  const trend = await screen.findByText(/^Trend [\d.]+ (lb|kg)$/);
  expect(group?.firstElementChild?.contains(trend)).toBe(true);
});

// MM-294: a save that removes the field says so, aloud, with the number typed.
it('says the weigh-in was saved, with the number typed', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4');
  await userEvent.click(screen.getByRole('button', { name: 'Save weigh-in' }));
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
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Open today’s food' }));
  // Food is showing: its meals (there is no bar to read, MM-711).
  expect(await screen.findByRole('heading', { name: 'Breakfast' })).toBeInTheDocument();
});

it('pressing the coach line opens the Coach destination', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400), targets(today.addDays(-2), 2320)] });
  renderApp(repos, today);
  await userEvent.click(await screen.findByText(/Targets went down about 80 kcal/));
  expect(await screen.findByRole('heading', { name: 'Your targets' })).toBeInTheDocument();
});

// MM-301 (ME-4): the Dashboard asks on the day the weekly reminder does, never sooner.
it('asks for the waist from the day a measurement stops counting, not before', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  await repos.waist.saveWaist(today.addDays(-(ReminderRule.measurementEveryDays - 1)), 94);
  const view = renderApp(repos, today);
  expect(await screen.findByText('Waist · ' + Fmt.day(today.addDays(-(ReminderRule.measurementEveryDays - 1)), today))).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Today’s waist, inches' })).not.toBeInTheDocument();
  view.unmount();
  renderApp(repos, today.addDays(1));
  expect(await screen.findByRole('textbox', { name: 'Today’s waist, inches' })).toBeInTheDocument();
});

// MM-301 (PD-1, UX-3): the weekly waist's Save is secondary, and each Save is heard with what it saves.
it('names each Save for what it saves, and keeps the waist Save secondary', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4');
  await userEvent.type(screen.getByRole('textbox', { name: 'Today’s waist, inches' }), '36');
  expect(screen.getByRole('button', { name: 'Save weigh-in' })).toHaveClass('mm-button-primary');
  expect(screen.getByRole('button', { name: 'Save waist' })).toHaveClass('mm-button-secondary');
});

// MM-301: the waist is measured in place when none counts, from one reading, and the save offers Progress.
it('asks for the waist in place when none counts, and keeps one reading', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  await repos.waist.saveWaist(today.addDays(-9), 94);
  renderApp(repos, today);
  const field = await screen.findByRole('textbox', { name: 'Today’s waist, inches' });
  const row = field.closest('.mm-list-row') as HTMLElement;
  expect(row).toHaveTextContent(/Last 37 in · /);
  await userEvent.type(field, '36{Enter}');
  expect(await screen.findByRole('status')).toHaveTextContent('Waist saved: 36 in');
  expect(screen.getByRole('button', { name: 'Open Progress' })).toBeInTheDocument();
  expect(await screen.findByText('Waist · Today')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Today’s waist, inches' })).not.toBeInTheDocument();
  const waist = await first(repos.waist.watchWaist());
  const last = waist[waist.length - 1];
  expect(last?.date).toBe(today);
  expectClose(last?.waistCm ?? 0, 91.44, 0.01);
  expect(last?.readings).toHaveLength(1);
});

it('shows a waist measured this week and does not ask for it', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  await repos.waist.saveWaist(today.addDays(-3), 94);
  renderApp(repos, today);
  expect(await screen.findByText('37 in')).toBeInTheDocument();
  expect(screen.queryByRole('textbox', { name: 'Today’s waist, inches' })).not.toBeInTheDocument();
});

it('opens Progress from the waist confirmation', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s waist, inches' }), '36{Enter}');
  await userEvent.click(await screen.findByRole('button', { name: 'Open Progress' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Coach' })).toBeInTheDocument();
});

it('refuses a waist that cannot be one, and records nothing', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s waist, inches' }), '3{Enter}');
  expect(await screen.findByText('That value looks off. Check it.')).toBeInTheDocument();
  expect(await first(repos.waist.watchWaist())).toEqual([]);
});

it('offers Progress from the weigh-in confirmation too', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4{Enter}');
  expect(await screen.findByRole('status')).toHaveTextContent('Saved 181.4 lb for today');
  expect(screen.getByRole('button', { name: 'Open Progress' })).toBeInTheDocument();
});

// MM-301 (ME-5): the waist is said to the quarter inch a tape can tell, as typed.
it('confirms a quarter-inch waist as typed', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s waist, inches' }), '35.25{Enter}');
  expect(await screen.findByRole('status')).toHaveTextContent('Waist saved: 35.25 in');
});

// MM-288, amended by MM-438: the Dashboard has no Add food; before the weigh-in its one Ember action is the row's Save.
it('the weigh-in’s Save is the only primary action while it asks', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await screen.findByRole('button', { name: 'Save weigh-in' });
  // Save is enabled once a weight is typed; nothing else on the screen is primary.
  await userEvent.type(screen.getByRole('textbox', { name: 'Today’s weigh-in' }), '181.4');
  expect(screen.queryByRole('button', { name: 'Add food' })).not.toBeInTheDocument();
  expect(document.querySelectorAll('.mm-button-primary:not([disabled]), .mm-fab, .mm-button-lead')).toHaveLength(1);
});

// MM-304 (UX-5): after a save in place, focus is on the row that takes the entry's place.
it('after the weigh-in is saved, focus is on the weight row that replaces the field', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4{Enter}');
  const row = await screen.findByRole('button', { name: /^Trend \d/ });
  expect(document.activeElement).toBe(row);
});

it('after the waist is saved, focus is on the waist row that replaces the field', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s waist, inches' }), '36{Enter}');
  const row = await screen.findByRole('button', { name: /^36 in/ });
  expect(document.activeElement).toBe(row);
});

// MM-304 (UX-6, PD-6): the waist's confirmation opens Progress at its Waist section, unfolded and in hand; the weigh-in's at the top.
it('"Open Progress" from the waist confirmation lands on the Waist section, open', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s waist, inches' }), '36{Enter}');
  await userEvent.click(await screen.findByRole('button', { name: 'Open Progress' }));
  const header = await screen.findByRole('button', { name: /^Waist/, expanded: true });
  expect(document.activeElement).toBe(header);
  expect(screen.getByText(/^Today’s waist is recorded: 36 in\. Saving again replaces it\.$/)).toBeInTheDocument();
});

it('"Open Progress" from the weigh-in confirmation lands at the top', async () => {
  await seed({ weighedToday: false, history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181.4{Enter}');
  await userEvent.click(await screen.findByRole('button', { name: 'Open Progress' }));
  await screen.findByText(/^Trend weight/);
  expect((document.querySelector('main.app-body') as HTMLElement).scrollTop).toBe(0);
  expect(screen.getByRole('button', { name: /^Waist/ })).toHaveAttribute('aria-expanded', 'false');
});

// MM-677 (the owner): today's steps and the week's cardio from the wearable against their floors, opening Train.
it('shows today\'s steps and the week\'s cardio against the floors, and opens Train', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  const start = new Date(2026, 9, 4, 7, 5);
  await repos.cardioSessions.saveCardioSessions([
    new CardioSession({ platformId: 'hk-walk', sourceName: 'Watch', activity: 'walking', start, end: new Date(start.getTime() + 42 * 60000) }),
    new CardioSession({ platformId: 'hk-run', sourceName: 'Watch', activity: 'running', start: new Date(2026, 9, 2, 18), end: new Date(2026, 9, 2, 18, 54) }),
  ]);
  await repos.dailySteps.saveDailySteps([
    { date: today, steps: 6100 },
    { date: today.addDays(-1), steps: 9000 },
  ]);
  renderApp(repos, today);
  const row = await screen.findByRole('button', { name: /^6,100 steps today · 1 h 36 min of cardio this week/ });
  expect(row).toHaveTextContent('Floors 8,000 a day · 2 h 30 min a week');
  await userEvent.click(row);
  expect(await screen.findByRole('button', { name: /^Cardio/ })).toBeInTheDocument();
});

it('without a wearable the cardio row says what would bring it', async () => {
  await seed({ history: [targets(today.addDays(-30), 2400)] });
  renderApp(repos, today);
  const row = await screen.findByRole('button', { name: /^Cardio/ });
  expect(row).toHaveTextContent('Comes from a watch or phone through Health Connect, which this phone does not have.');
});
