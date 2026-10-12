import { expect, it } from 'vitest';
import { CalendarDate, CoachingPolicy, Profile, ScreeningAnswers, UserSetup } from '../../src/domain';
import {
  BodyFatEstimate,
  CoachConfidence,
  CoachSnapshot,
  currentTargetRulesVersion,
  DailyTargets,
  nextTargets,
  TargetsRecord,
  TdeeEstimate,
} from '../../src/engine';
import { trendOf } from './support/trendPoints';

const today = CalendarDate.of(2026, 3, 1);

const setup = new UserSetup({
  profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 }),
  screening: new ScreeningAnswers(),
  trainingStatus: 'intermediate',
  trainingDaysPerWeek: 3,
  goalMode: 'fatLoss',
  onboardedOn: today.addDays(-60),
});

const previous = (rulesVersion = currentTargetRulesVersion) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-28),
    mode: 'fatLoss',
    tdeeKcal: 2800,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targetRulesVersion: rulesVersion,
    targets: new DailyTargets({ kcal: 2300, proteinG: 160, fatG: 70, carbsG: 250, weeklyRateFraction: -0.0075 }),
  });

const snapshot = ({
  eventOn,
  tdeeKcal = 2300,
  lossFraction = 0,
}: { eventOn?: CalendarDate | undefined; tdeeKcal?: number; lossFraction?: number } = {}) =>
  new CoachSnapshot({
    policy: CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }),
    trend: trendOf({ start: today.addDays(-21), levelKg: 85, lossFractionPerWeek: lossFraction }),
    trendWeightKg: 85,
    bodyFat: new BodyFatEstimate({ percent: 25, sigmaPercent: 2 }),
    bmrKcal: 1800,
    calorieFloorKcal: 1800,
    tdee: new TdeeEstimate({
      kcal: tdeeKcal,
      sigmaKcal: 200,
      status: 'updated',
      usableIntakeDays: 28,
      excludedPartialDays: 0,
      weighIns: 28,
    }),
    confidence: new CoachConfidence({
      level: 'fair',
      estimate: 'good',
      foodLog: 'good',
      weighIns: 'good',
      stability: 'fair',
      nextStep: 'waitForStability',
      usableFoodDays: 28,
      weighInDays: 28,
    }),
    recommendation: { mode: 'fatLoss', reason: 'cutFirst' },
    lastCreatineEventOn: eventOn,
  });

for (const daysAgo of [0, 7, 28]) {
  it(`ordinary reduction is paused ${daysAgo} days after creatine`, () => {
    expect(
      nextTargets({
        setup,
        snapshot: snapshot({ eventOn: today.addDays(-daysAgo) }),
        history: [previous()],
        today,
      }),
    ).toBeUndefined();
  });
}

for (const eventOn of [undefined, today.addDays(-29), today.addDays(1)]) {
  it(`ordinary reduction resumes outside the pause (${eventOn ?? 'no event'})`, () => {
    const last = previous();
    const next = nextTargets({ setup, snapshot: snapshot({ eventOn }), history: [last], today });
    expect(next).toBeDefined();
    expect(next?.targets.kcal).toBeLessThan(last.targets.kcal);
  });
}

it('an ordinary raise still applies during the creatine pause', () => {
  const last = previous();
  const next = nextTargets({ setup, snapshot: snapshot({ eventOn: today, tdeeKcal: 3400 }), history: [last], today });
  expect(next).toBeDefined();
  expect(next?.targets.kcal).toBeGreaterThan(last.targets.kcal);
});

it('a safe-pace raise still applies during the creatine pause', () => {
  const next = nextTargets({
    setup,
    snapshot: snapshot({ eventOn: today, lossFraction: 0.015 }),
    history: [previous()],
    today,
  });
  expect(next).toBeDefined();
  expect(next?.targets.flags).toContain('raisedForSafePace');
  expect(next?.targets.kcal).toBeGreaterThan(previous().targets.kcal);
});

it('explicit goal changes still apply during the creatine pause', () => {
  const next = nextTargets({
    setup: setup.copyWith({ goalMode: 'maintenance' }),
    snapshot: snapshot({ eventOn: today }),
    history: [previous()],
    today,
  });
  expect(next).toBeDefined();
  expect(next?.mode).toBe('maintenance');
});

it('profile corrections can reduce calories during the pause', () => {
  const next = nextTargets({
    setup: setup.copyWith({ profileRevision: 1 }),
    snapshot: snapshot({ eventOn: today }),
    history: [previous()],
    today,
  });
  expect(next).toBeDefined();
  expect(next?.targets.kcal).toBeLessThan(previous().targets.kcal);
  expect(next?.profileRevision).toBe(1);
});

it('target-rule corrections still apply during the pause', () => {
  const next = nextTargets({
    setup,
    snapshot: snapshot({ eventOn: today }),
    history: [previous(currentTargetRulesVersion - 1)],
    today,
  });
  expect(next).toBeDefined();
  expect(next?.targetRulesVersion).toBe(currentTargetRulesVersion);
});
