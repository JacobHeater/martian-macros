import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ExplanationLine } from '../../src/engine/ExplanationLine';
import { ExplanationReason } from '../../src/engine/ExplanationReason';
import { TargetsExplanation } from '../../src/engine/TargetsExplanation';
import type { TargetsRecord } from '../../src/engine/TargetsRecord';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { explanationLineText } from '../../src/format/explanationLineText';
import { Fmt } from '../../src/format/Fmt';
import { openCoach as openCoachTab } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-138: the Coach screen says when targets last changed and why. Carried over from last_change_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

const record = (daysAgo: number, kcal: number, explanation?: TargetsExplanation) =>
  targetsFrom(today.addDays(-daysAgo), {
    kcal,
    carbsG: kcal === 2325 ? 240 : 255,
    tdeeKcal: 2900,
    tdeeSigmaKcal: 250,
    tdeeStatus: 'updated',
    // Seen already: the summary of a change is its own test.
    summarySeen: true,
    ...(explanation === undefined ? {} : { explanation }),
  });

async function seed(history: readonly TargetsRecord[]): Promise<void> {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
  for (let d = 20; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 82);
  for (const r of history) await repos.targets.saveTargets(r);
}

async function openCoach(): Promise<void> {
  renderApp(repos, today);
  await openCoachTab();
  await screen.findByRole('heading', { name: /^Last change/ });
}

async function seeWhy(): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: 'See why' }));
  return screen.findByRole('dialog', { name: 'Why your targets are what they are' });
}

const ordinary = new TargetsExplanation({
  lines: [new ExplanationLine('expenditureEstimate', -90, { from: 2950, to: 2860 }), new ExplanationLine('stepLimit', 15)],
  previousKcal: 2400,
  newKcal: 2325,
  estimateStatus: 'updated',
  usableIntakeDays: 12,
  excludedPartialDays: 2,
  weighIns: 11,
});

const checked = (lines: readonly ExplanationLine[], newKcal: number) =>
  new TargetsExplanation({
    lines,
    previousKcal: 2400,
    newKcal,
    estimateStatus: 'updated',
    usableIntakeDays: 14,
    weighIns: 12,
  });

it('an ordinary change shows old and new, then the account', async () => {
  await seed([record(14, 2400), record(2, 2325, ordinary)]);
  await openCoach();
  expect(screen.getByText(/Calories 2,400 → 2,325/)).toBeInTheDocument();

  const sheet = within(await seeWhy());
  expect(sheet.getByText('What changed')).toBeInTheDocument();
  expect(sheet.getByText(/Calories 2,400 → 2,325\. Protein target unchanged/)).toBeInTheDocument();
  expect(sheet.getByText(/Carbohydrate 255 → 240 g/)).toBeInTheDocument();
  expect(sheet.getByText('Why')).toBeInTheDocument();
  // The week the check-in read, as its five facts, beside the reasons (MM-149).
  expect(sheet.getByText('Your last 7 days')).toBeInTheDocument();
  expect(sheet.getByText('Weigh-ins')).toBeInTheDocument();
  expect(sheet.getByText(/Your expenditure is 2,860 kcal a day, down from 2,950 \(−90\)/)).toBeInTheDocument();
  expect(
    sheet.getByText(/Weekly changes are limited, so 15 kcal of the decrease is held for next week/),
  ).toBeInTheDocument();
  expect(sheet.getByText('What it was based on')).toBeInTheDocument();
  expect(sheet.getByText(/12 days of food, 2 left out as partial and 11 weigh-ins/)).toBeInTheDocument();
  expect(sheet.getByText('What would change it')).toBeInTheDocument();
});

it('targets from before explanations were kept say so', async () => {
  await seed([record(14, 2400), record(7, 2325)]);
  await openCoach();
  expect(screen.getByText('No explanation was recorded for these targets.')).toBeInTheDocument();
});

it('the first targets are described as such', async () => {
  await seed([
    record(
      3,
      2400,
      new TargetsExplanation({
        lines: [new ExplanationLine('firstTargets', 2400)],
        newKcal: 2400,
        estimateStatus: 'held',
      }),
    ),
  ]);
  await openCoach();
  expect(screen.getByText('Your first targets.')).toBeInTheDocument();
});

it('a check-in with no material change says why', async () => {
  await seed([record(9, 2400), record(2, 2400, checked([], 2400))]);
  await openCoach();
  expect(screen.getByText(new RegExp(`Checked ${Fmt.day(today.addDays(-2), today)}\\. No change:`))).toBeInTheDocument();
  const sheet = within(await seeWhy());
  expect(
    sheet.getByText('No calculated contribution was large enough to move the calorie target.'),
  ).toBeInTheDocument();
});

it('a rounded contribution remainder is shown in the account', async () => {
  await seed([
    record(9, 2400),
    record(2, 2398, checked([new ExplanationLine('expenditureEstimate', -1, { from: 2900, to: 2899 })], 2398)),
  ]);
  await openCoach();
  const sheet = within(await seeWhy());
  expect(sheet.getByText('And −1 kcal from rounding and limits.')).toBeInTheDocument();
});

it('three weeks with no food logged: targets are unchanged for lack of data, and what is needed', async () => {
  await seed([record(30, 2400)]);
  await openCoach();
  expect(screen.getByText(/Targets are unchanged because there is not enough data yet/)).toBeInTheDocument();
  expect(screen.getAllByText(/Needs 10 more fully logged days/).length).toBeGreaterThan(0);
});

it('a creatine change explains the reduction pause', async () => {
  await seed([record(30, 2400)]);
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-7), type: 'startedCreatine' });
  await openCoach();
  expect(
    await screen.findByText(/Calorie reductions are paused while your creatine change settles\./),
  ).toBeInTheDocument();
});

it('an app rule update is named as the cause', async () => {
  await seed([record(9, 2400), record(2, 2325, checked([new ExplanationLine('appRuleUpdate', -75)], 2325))]);
  await openCoach();
  expect(screen.getByText(/The target rules changed in an app update/)).toBeInTheDocument();
});

it('no explanation line puts the change down to what the user ate', () => {
  for (const reason of ExplanationReason.values) {
    const text = explanationLineText(new ExplanationLine(reason, -75, { from: 2400, to: 2325 })).toLowerCase();
    for (const blame of ['because you ate', 'you ate', 'went over', 'overate', 'because you went', 'your eating']) {
      expect(text, reason).not.toContain(blame);
    }
  }
});
