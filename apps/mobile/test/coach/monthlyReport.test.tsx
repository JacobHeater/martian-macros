import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { ExplanationLine } from '../../src/engine/ExplanationLine';
import { TargetsExplanation } from '../../src/engine/TargetsExplanation';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';
import { topLayer } from '../support/topLayer';
import { workoutOn } from '../support/workoutOn';
import { dashboardLoaded } from '../support/dashboardLoaded';

/** MM-33: a monthly report on day 28, then monthly. Carried over from monthly_report_test.dart. */
const onboarded = CalendarDate.of(2026, 9, 1);
let repos: InMemoryRepositories;

async function seed({
  daysSinceOnboarding,
  loggedDays = 28,
  twoChanges = true,
}: {
  daysSinceOnboarding: number;
  loggedDays?: number;
  twoChanges?: boolean;
}): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: onboarded, healthCheckConfirmedOn: onboarded }));
  for (let d = 0; d < loggedDays; d++) {
    const date = onboarded.addDays(d);
    await repos.food.addFood(foodOn(date));
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  for (let d = 0; d <= daysSinceOnboarding; d += 2) await repos.weights.saveWeight(onboarded.addDays(d), 90 - d * 0.03);
  const record = (day: number, kcal: number, previous: number, tdee: number) =>
    targetsFrom(onboarded.addDays(day), {
      kcal,
      proteinG: 160,
      carbsG: 200,
      tdeeKcal: tdee,
      tdeeSigmaKcal: 180,
      tdeeStatus: 'updated',
      explanation: new TargetsExplanation({
        lines: [new ExplanationLine('expenditureEstimate', kcal - previous, { from: previous, to: kcal })],
        previousKcal: previous,
        newKcal: kcal,
        estimateStatus: 'updated',
      }),
    });
  await repos.targets.saveTargets(record(14, 2150, 2200, 2650));
  if (twoChanges) await repos.targets.saveTargets(record(21, 2050, 2150, 2580));
}

async function open(today: CalendarDate): Promise<void> {
  renderApp(repos, today);
  await dashboardLoaded();
}

async function openFirstReport(today: CalendarDate): Promise<void> {
  await open(today);
  await openCoach();
  const reports = (await screen.findByRole('heading', { name: 'Monthly reports' })).closest('.mm-section') as HTMLElement;
  // The section is open in the week a report arrives and folded after (MM-256).
  if (within(reports).queryByRole('button', { name: /^Sep 1 – Sep 28/ }) === null) {
    await userEvent.click(within(reports).getByRole('button', { name: /^Monthly reports/ }));
  }
  await userEvent.click(within(reports).getByRole('button', { name: /^Sep 1 – Sep 28/ }));
  await within(topLayer()).findByRole('heading', { name: 'What you did' });
}

/** The text of the open report only, not the screens beneath it. */
const shown = () => topLayer().textContent ?? '';
const estimate = () =>
  within(topLayer()).getByRole('heading', { name: 'What the coach measured' }).closest('.mm-surface') as HTMLElement;

it('no report until 28 days have passed', async () => {
  await seed({ daysSinceOnboarding: 27 });
  await open(onboarded.addDays(27));
  expect(screen.queryByText('Your first month is done')).not.toBeInTheDocument();
  await openCoach();
  await screen.findByRole('heading', { name: 'Body' });
  expect(screen.queryByRole('heading', { name: 'Monthly reports' })).not.toBeInTheDocument();
});

it('the day after day 28 the first report is ready', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await open(onboarded.addDays(28));
  expect(screen.getByText('Your first month is done')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Open the report' }));
  expect(await within(topLayer()).findByRole('heading', { name: 'Sep 1 – Sep 28' })).toBeInTheDocument();
  expect(within(topLayer()).getByRole('heading', { name: 'What you did' })).toBeInTheDocument();
});

it('it stops announcing itself after a week', async () => {
  await seed({ daysSinceOnboarding: 35 });
  await open(onboarded.addDays(35));
  expect(screen.queryByText('Your first month is done')).not.toBeInTheDocument();
});

it('the report holds the work, the body and the estimate', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await openFirstReport(onboarded.addDays(28));
  expect(within(topLayer()).getByText('28 of 28')).toBeInTheDocument();
  expect(within(estimate()).getByText('2,580 kcal a day, give or take 180.')).toBeInTheDocument();
  expect(shown()).not.toContain('Not measured');
});

it('both target changes are listed with their estimate', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await openFirstReport(onboarded.addDays(28));
  const all = shown();
  expect(all).toContain('Sep 15: 2,200 to 2,150 kcal.');
  expect(all).toContain('Sep 22: 2,150 to 2,050 kcal.');
  expect(all).toContain('Based on an expenditure estimate of 2,650 kcal');
  expect(all).toContain('Based on an expenditure estimate of 2,580 kcal');
});

it('six logged days: the estimate could not be measured, and why', async () => {
  await seed({ daysSinceOnboarding: 28, loggedDays: 6, twoChanges: false });
  await openFirstReport(onboarded.addDays(28));
  const all = shown();
  expect(all).toContain('Not measured this month: only 6 whole days');
  expect(all).toContain('at least 14');
  // The estimate card shows no number; a target change still names the
  // starting estimate it was made from.
  expect(estimate().textContent).not.toContain('give or take');
});

it('a report can be reread from the Coach screen later', async () => {
  await seed({ daysSinceOnboarding: 88 });
  await openFirstReport(onboarded.addDays(88));
  expect(within(topLayer()).getByRole('heading', { name: 'Sep 1 – Sep 28' })).toBeInTheDocument();
  expect(within(topLayer()).getByText('28 of 28')).toBeInTheDocument();
});

const trainedOn = (day: number, squatKg: number) =>
  repos.workouts.saveWorkout(workoutOn(onboarded.addDays(day), [['back-squat', 1, squatKg]]));

it('a month with training lists the workouts and each lift', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await trainedOn(2, 220);
  await trainedOn(23, 240);
  await openFirstReport(onboarded.addDays(28));

  const work = within(topLayer()).getByRole('heading', { name: 'What you did' }).closest('.mm-surface');
  expect(within(work as HTMLElement).getByText('Workouts')).toBeInTheDocument();
  // The lift is also in the Personal records card (MM-92): the second session beat the first.
  const lifts = within(topLayer()).getByRole('heading', { name: 'Your lifts' }).closest('.mm-surface') as HTMLElement;
  expect(within(lifts).getByText('Back squat')).toBeInTheDocument();
  // 220 kg then 240 kg for one rep: the estimates are 227.3 and 248 kg,
  // and the last is smoothed with the one before it.
  expect(within(lifts).getByText('501.2 lb to 524.0 lb (+22.8 lb)')).toBeInTheDocument();
  expect(shown()).toContain('not tested');
});

it('a month with one session of a lift says why none is shown', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await trainedOn(2, 100);
  await openFirstReport(onboarded.addDays(28));

  expect(shown()).toContain('No lift had two sessions this month');
});

it('a month with no training has no lifts card', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await openFirstReport(onboarded.addDays(28));

  expect(shown()).not.toContain('Your lifts');
  expect(shown()).not.toContain('Workouts');
});

it('the month\'s longest logging run is in what you did (MM-92)', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await openFirstReport(onboarded.addDays(28));
  const work = within(topLayer()).getByRole('heading', { name: 'What you did' }).closest('.mm-surface') as HTMLElement;
  expect(within(work).getByText('Longest logging run')).toBeInTheDocument();
  expect(within(work).getByText('28 whole days in a row')).toBeInTheDocument();
});

it('a month with two logged days says no run', async () => {
  await seed({ daysSinceOnboarding: 28, loggedDays: 2, twoChanges: false });
  await openFirstReport(onboarded.addDays(28));
  expect(shown()).not.toContain('Longest logging run');
});

it('the personal records set in the month are listed, with the day (MM-92)', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await trainedOn(2, 220);
  await trainedOn(9, 230);
  await trainedOn(23, 240);
  await openFirstReport(onboarded.addDays(28));
  const card = within(topLayer()).getByRole('heading', { name: 'Personal records' }).closest('.mm-surface') as HTMLElement;
  // The first session sets none: there is nothing to beat.
  expect(within(card).getAllByText('Back squat')).toHaveLength(2);
  expect(within(card).getByText('Sep 10')).toBeInTheDocument();
  expect(within(card).getByText('Sep 24')).toBeInTheDocument();
});

it('a month whose training set no record has no records card', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await trainedOn(2, 220);
  await trainedOn(23, 200);
  await openFirstReport(onboarded.addDays(28));
  expect(shown()).not.toContain('Personal record');
});

it('nothing in a report grades or praises', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await openFirstReport(onboarded.addDays(28));
  const all = shown().toLowerCase();
  for (const word of ['score', 'grade', 'great', 'well done', 'good job', 'lowest', 'on track', 'cheat', 'under target']) {
    expect(all, word).not.toContain(word);
  }
});

/** MM-450: weekly waist entries from three weeks before the month, and weigh-ins from a month before. */
async function measuredWaist({ eatingDisorderHistory = false }: { eatingDisorderHistory?: boolean } = {}): Promise<void> {
  await seed({ daysSinceOnboarding: 28 });
  if (eatingDisorderHistory) {
    await repos.setup.saveSetup(
      typicalSetup({
        onboardedOn: onboarded,
        healthCheckConfirmedOn: onboarded,
        screening: new ScreeningAnswers({ eatingDisorderHistory: true }),
      }),
    );
  }
  for (let d = -30; d < 0; d += 2) await repos.weights.saveWeight(onboarded.addDays(d), 90.5);
  for (const d of [-21, -14, -7, 6, 13, 20, 27]) await repos.waist.saveWaist(onboarded.addDays(d), 92, { readings: [92, 92, 92] });
}

it('a month with no waist entries says nothing about body fat (MM-450)', async () => {
  await seed({ daysSinceOnboarding: 28 });
  await openFirstReport(onboarded.addDays(28));
  expect(shown()).not.toContain('Body fat');
});

it('a settled range from the waist is shown as a range, at the end of the month and when it began (MM-450)', async () => {
  await measuredWaist();
  await openFirstReport(onboarded.addDays(28));
  expect(within(topLayer()).getByText('Body fat')).toBeInTheDocument();
  expect(within(topLayer()).getByText(/^\d+–\d+% \(from your waist\)$/)).toBeInTheDocument();
  expect(shown()).toMatch(/\d+–\d+% when the month began;/);
});

it('with an eating-disorder history the report shows no change in body fat (MM-450)', async () => {
  await measuredWaist({ eatingDisorderHistory: true });
  await openFirstReport(onboarded.addDays(28));
  expect(within(topLayer()).getByText(/^\d+–\d+% \(from your waist\)$/)).toBeInTheDocument();
  expect(shown()).toContain('At the end of the month;');
  expect(shown()).not.toContain('when the month began');
});
