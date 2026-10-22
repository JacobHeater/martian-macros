import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Exercise } from '../../src/domain/training/Exercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { MonthlyReport } from '../../src/engine/MonthlyReport';
import { ReportPeriod } from '../../src/engine/ReportPeriod';
import { StrengthTrend } from '../../src/engine/StrengthTrend';
import { WeightJumpExplanation } from '../../src/engine/WeightJumpExplanation';
import { Fmt } from '../../src/format/Fmt';
import { liftSummary } from '../../src/format/liftSummary';
import { MonthlyReportText } from '../../src/format/MonthlyReportText';
import { personalRecordText } from '../../src/format/personalRecordText';
import { weightJumpText } from '../../src/format/weightJumpText';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import type { WeightDisplay } from '../../src/domain/WeightDisplay';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { StrengthTrendCard } from '../../src/ui/StrengthTrendCard';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-118: coached by the weight without having to look at it. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

/** A body weight in any unit, as a screen would print it. */
const weightFigure = /\d+(\.\d+)? ?(kg|lb)\b/;
/** Today's reading, far enough off the trend that no trend figure prints it. */
const todaysReading = 84.3;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/** Three weeks of a cut, weighed daily, losing half a kilogram a week, with today's reading off the trend. */
async function threeWeeks({
  display,
  eatingDisorderHistory = false,
  weighedToday = true,
}: { display?: WeightDisplay; eatingDisorderHistory?: boolean; weighedToday?: boolean } = {}) {
  const setup = typicalSetup({
    goalMode: 'fatLoss',
    onboardedOn: today.addDays(-35),
    healthCheckConfirmedOn: today,
    screening: new ScreeningAnswers({ eatingDisorderHistory }),
  });
  await repos.setup.saveSetup(setup.copyWith({ unitSystem: 'metric' }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-21), { kcal: 2100, tdeeKcal: 2600 }));
  for (let i = 1; i <= 21; i++) await repos.weights.saveWeight(today.addDays(-i), 80 + (i * 0.5) / 7 + (i % 2 === 0 ? 0.3 : -0.3));
  if (weighedToday) await repos.weights.saveWeight(today, todaysReading);
  if (display !== undefined) await repos.preferences.saveWeightDisplay(display);
}

const dots = () => document.querySelectorAll('.chart-trend circle').length;

it('Trend only: the chart is a line and band with no dots, and no raw reading appears', async () => {
  await threeWeeks({ display: 'trendOnly' });
  renderApp(repos, today);
  expect(await screen.findByText(/^Trend [\d.]+ kg$/)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain(`${todaysReading}`);
  await openTab('Progress');
  await screen.findByText(/last 7 days/);
  expect(document.querySelector('.chart-trend')).not.toBeNull();
  expect(dots()).toBe(0);
  expect(document.body.textContent).not.toContain(`${todaysReading}`);
  expect(screen.getByRole('textbox', { name: 'Today’s weigh-in' })).toHaveValue('');
});

it('Switching back: with Everything the full history of readings is shown', async () => {
  await threeWeeks({ display: 'trendOnly' });
  await repos.preferences.saveWeightDisplay('everything');
  renderApp(repos, today);
  expect(await screen.findByText(new RegExp(`^Today ${todaysReading} kg`))).toBeInTheDocument();
  await openTab('Progress');
  await screen.findByText(/last 7 days/);
  expect(dots()).toBeGreaterThan(20);
});

it('Hidden: no screen shows a weight in any unit, and the dashboard says the pace in words', async () => {
  await threeWeeks({ display: 'hidden' });
  renderApp(repos, today);
  expect(await screen.findByText(/^(So far, )?(on pace|On pace|slower than planned|Slower than planned|faster than planned|Faster than planned|steady|Steady)$/)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(weightFigure);
  for (const tab of ['Progress', 'Coach']) {
    await openTab(tab);
    await screen.findByText(tab === 'Progress' ? /Against your plan’s pace/ : 'Your metabolism');
    expect(document.body.textContent, tab).not.toMatch(weightFigure);
  }
  expect(document.querySelector('.chart-trend')).toBeNull();
});

it('The coach still works: with the weight hidden, what it works out is what it works out with Everything', async () => {
  const metabolism = async () => {
    renderApp(repos, today);
    await openTab('Coach');
    const heading = await screen.findByRole('heading', { name: 'Your metabolism' });
    return (heading.closest('.mm-section') as HTMLElement).textContent;
  };
  await threeWeeks({ display: 'hidden' });
  const hidden = await metabolism();
  cleanup();
  await repos.preferences.saveWeightDisplay('everything');
  expect(await metabolism()).toBe(hidden);
});

it('a weigh-in typed with the trend only is confirmed with "Saved" and no echo', async () => {
  await threeWeeks({ display: 'trendOnly', weighedToday: false });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), `${todaysReading}`);
  await userEvent.click(screen.getByRole('button', { name: 'Save weigh-in' }));
  expect(await screen.findByText('Saved')).toBeInTheDocument();
  expect(screen.queryByText(/^Saved .* for today$/)).not.toBeInTheDocument();
  await expect.poll(async () => (await first(repos.weights.watchWeights())).some((w) => w.date === today)).toBe(true);
});

it('Default for eating-disorder history: Trend only, said, and changeable', async () => {
  await threeWeeks({ eatingDisorderHistory: true });
  renderApp(repos, today);
  expect(await screen.findByText(/^Trend [\d.]+ kg$/)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain(`${todaysReading}`);
  const settings = await openSettings();
  const row = (await settings.findByText('Weight display')).closest('.mm-list-row') as HTMLElement;
  expect(within(row).getByText('Trend only')).toBeInTheDocument();
  await userEvent.click(within(row).getByRole('button', { name: 'Change weight display' }));
  const sheet = await screen.findByRole('dialog', { name: 'Weight display' });
  expect(within(sheet).getByText('Your backup and any export still contain the numbers.')).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Everything/ }));
  await expect.poll(async () => first(repos.preferences.watchWeightDisplay())).toBe('everything');
});

it('offered once, with no comment, after more than one weigh-in a day on five days in two weeks; remembered once answered', async () => {
  await threeWeeks({ weighedToday: false });
  const at = (daysAgo: number, hour: number) => {
    const day = today.addDays(-daysAgo);
    return new Date(day.year, day.month - 1, day.day, hour, 0);
  };
  await repos.healthSamples.upsert(
    [1, 3, 5, 7, 9].flatMap((d) =>
      [7, 8].map((hour) => ({
        platformId: `w-${d}-${hour}`,
        type: 'weight' as const,
        value: 80 + hour / 10,
        start: at(d, hour),
        sourceId: 'com.example.scale',
        sourceName: 'Scale',
      })),
    ),
  );
  renderApp(repos, today);
  const offer = (await screen.findByText('How much of your weight to show')).closest('.mm-notice') as HTMLElement;
  expect(offer.textContent).not.toMatch(/often|too much|a lot/i);
  await userEvent.click(within(offer).getByRole('button', { name: 'Not now' }));
  await expect.poll(async () => first(repos.preferences.watchWeightDisplayOffered())).toBe(true);
  expect(screen.queryByText('How much of your weight to show')).not.toBeInTheDocument();
  cleanup();
  renderApp(repos, today);
  await screen.findByRole('textbox', { name: 'Today’s weigh-in' });
  expect(screen.queryByText('How much of your weight to show')).not.toBeInTheDocument();
});

describe('Hidden: a bodyweight lift says its best set, not an estimate that carries the body weight', () => {
  const hidden = new Fmt('metric', { weightDisplay: 'hidden' });
  const everything = new Fmt('metric');
  const pullUp = new Exercise({ id: 'pull-up', name: 'Pull-up', equipment: 'bodyweight', primary: 'back', load: 'bodyweight' });
  // Body weight 80 kg plus 10 kg for 8: an estimate near 110 kg, which would give the body weight away.
  const best = new WorkoutSet({ reps: 8, loadKg: 10 });
  const trend = new StrengthTrend({
    exerciseId: 'pull-up',
    exercise: pullUp,
    points: [0, 7, 14, 21, 28].map((d, i) => ({
      workoutId: i + 1,
      date: today.addDays(-28 + d),
      estimateKg: 105 + i,
      trendKg: 104.5 + i,
      bestSet: best,
    })),
    loggedSessions: 5,
    recentSessions: 5,
  });
  /** Any figure of the estimates (104.5 to 109.0 kg); no word boundary, since a card's text runs its title into it. */
  const estimateFigure = /10\d\.\d kg/;

  it('the lift line: the best set, and its change in words', () => {
    expect(liftSummary(trend, everything)).toMatch(/^Est\. max 108\.5 kg with body weight · .4\.0 kg in 4 weeks$/);
    const line = liftSummary(trend, hidden);
    expect(line).toBe('Best set 8 × +10 kg · up over 4 weeks');
    expect(line).not.toMatch(estimateFigure);
  });

  it('a personal record: the set that made it', () => {
    const record = { exerciseId: 'pull-up', name: 'Pull-up', estimateKg: 109, previousBestKg: 107, load: 'bodyweight' as const, bestSet: best };
    expect(personalRecordText(record, hidden)).toBe('Pull-up: a new best, 8 × +10 kg.');
    expect(personalRecordText(record, everything)).toBe('Pull-up: estimated max 109.0 kg, up from 107.0 kg.');
  });

  it('the strength card: no estimate, no chart of it; the best set and the change in words', () => {
    const { container } = render(<StrengthTrendCard trend={trend} fmt={hidden} today={today} />);
    expect(container.textContent).not.toMatch(estimateFigure);
    expect(container.textContent).toContain('8 × +10 kg');
    expect(container.textContent).toContain('4 weeks: up');
    expect(container.querySelector('.chart')).toBeNull();
    // With everything shown, the estimate and its chart are there.
    cleanup();
    const shown = render(<StrengthTrendCard trend={trend} fmt={everything} today={today} />);
    expect(shown.container.textContent).toMatch(estimateFigure);
    expect(shown.container.querySelector('.chart')).not.toBeNull();
  });

  it('the monthly report: the lift’s change in words, and a record as its set', () => {
    const words = new MonthlyReportText(
      new MonthlyReport({
        period: new ReportPeriod({ index: 0, from: today.addDays(-31) }),
        daysLogged: 20,
        completeDays: 20,
        weighIns: 10,
        targetChanges: [],
        workouts: 8,
        lifts: [{ name: 'Pull-up', sessions: 4, fromKg: 104, toKg: 108, load: 'bodyweight' }],
        personalRecords: [
          { exerciseId: 'pull-up', name: 'Pull-up', estimateKg: 109, previousBestKg: 107, load: 'bodyweight', bestSet: best, date: today.addDays(-3) },
        ],
      }),
      hidden,
      today,
    );
    expect(words.lifts).toEqual([['Pull-up', 'up over the month']]);
    expect(words.personalRecords[0]?.[1]).toBe('A new best, 8 × +10 kg');
    expect(JSON.stringify([words.lifts, words.personalRecords])).not.toMatch(estimateFigure);
  });

  it('a weigh-in far off the trend: no energy figure, which is the difference in weight times a constant', () => {
    const jump = new WeightJumpExplanation({ date: today, readingKg: 81.1, trendKg: 80, thresholdKg: 0.48, causes: [], fatKcal: 1.1 * 9440 });
    const { evidence } = weightJumpText(jump, hidden, today);
    expect(JSON.stringify(evidence)).not.toMatch(/kcal/);
    expect(evidence).toContainEqual(['For this to be fat', 'Far more over your expenditure than one day can be']);
    expect(JSON.stringify(weightJumpText(jump, everything, today).evidence)).toMatch(/kcal/);
  });
});
