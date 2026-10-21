import { describe, expect, it } from 'vitest';
import { CalendarDate, type LeanGainPace, Profile, ScreeningAnswers, type TrainingStatus, UserSetup } from '../../src/domain';
import {
  analyze,
  BodyFatEstimate,
  type CoachSnapshot,
  computeTargets,
  describeLeanGainPaces,
  LeanGainReview,
  LeanGainRule,
  nextTargets,
  SafetyBounds,
  TargetInputs,
  TargetsRecord,
} from '../../src/engine';
import { upTo } from '../support/upTo';

/** MM-480: a slower lean-gain pace the user can choose, under the MM-129 surplus cap. */
const start = CalendarDate.of(2026, 1, 1);
const today = start.addDays(30);

const setup = (leanGainPace: LeanGainPace, trainingStatus: TrainingStatus = 'intermediate') =>
  new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening: new ScreeningAnswers(),
    trainingStatus,
    trainingDaysPerWeek: 4,
    goalMode: 'leanGain',
    onboardedOn: start,
    leanGainPace,
  });

const snapshotFor = (s: UserSetup) =>
  analyze({
    setup: s,
    weights: upTo(30).map((d) => ({ date: start.addDays(d), weightKg: 80 })),
    intake: [],
    today,
  }) as CoachSnapshot;

const inputs = ({
  leanGainPace,
  status = 'intermediate',
  weightKg = 80,
  bodyFat = 15,
  tdee = 2700,
}: {
  leanGainPace?: LeanGainPace;
  status?: TrainingStatus;
  weightKg?: number;
  bodyFat?: number;
  tdee?: number;
} = {}) => {
  const s = setup(leanGainPace ?? 'standard', status);
  return new TargetInputs({
    sex: 'male',
    heightCm: 178,
    trendWeightKg: weightKg,
    bodyFat: new BodyFatEstimate({ percent: bodyFat, sigmaPercent: 2 }),
    mode: 'leanGain',
    trainingStatus: status,
    trainingDaysPerWeek: 4,
    policy: snapshotFor(s).policy,
    tdeeKcal: tdee,
    bmrKcal: 1800,
    ...(leanGainPace === undefined ? {} : { leanGainPace }),
  });
};

describe('the pace', () => {
  it('the slower gain is half the pace training status sets, and never faster', () => {
    for (const status of ['untrained', 'novice', 'returning', 'intermediate', 'advanced'] as const) {
      const standard = computeTargets(inputs({ status }));
      const slower = computeTargets(inputs({ status, leanGainPace: 'slower' }));
      expect(slower.weeklyRateFraction, status).toBeCloseTo(standard.weeklyRateFraction * LeanGainRule.slowerPaceFactor, 9);
      expect(slower.kcal, status).toBeLessThan(standard.kcal);
      expect(slower.kcal, status).toBeGreaterThan(2700);
    }
  });

  it('no pace given is the standard one', () => {
    expect(computeTargets(inputs()).weeklyRateFraction).toBe(0.0015);
    expect(computeTargets(inputs({ leanGainPace: 'standard' })).weeklyRateFraction).toBe(0.0015);
  });

  it('stays under the surplus cap', () => {
    for (const weightKg of [60, 100, 160]) {
      for (const status of ['novice', 'advanced'] as const) {
        const t = computeTargets(inputs({ status, weightKg, bodyFat: 35, leanGainPace: 'slower' }));
        if (t.flags.has('flooredAtSafetyMinimum')) continue;
        expect(t.kcal - 2700, `${status} at ${weightKg} kg`).toBeLessThanOrEqual(SafetyBounds.maxSurplusKcal(status, 2700) + 1e-9);
      }
    }
  });

  it('both paces are described with the figures they mean today', () => {
    const [standard, slower] = describeLeanGainPaces(inputs());
    expect(standard?.pace).toBe('standard');
    expect(standard?.fraction).toBe(0.0015);
    expect(slower?.pace).toBe('slower');
    expect(slower?.fraction).toBeCloseTo(0.00075, 9);
    expect(slower?.surplusKcal).toBeGreaterThan(0);
    expect(slower?.surplusKcal).toBeLessThan(standard?.surplusKcal ?? 0);
    expect(slower?.targetKcal).toBeCloseTo(2700 + (slower?.surplusKcal ?? 0), 6);
    expect(standard?.capped).toBe(false);
  });
});

describe('choosing it', () => {
  const standardTargets = computeTargets(inputs());
  const last = (leanGainPace?: LeanGainPace) =>
    new TargetsRecord({
      effectiveFrom: start.addDays(28),
      mode: 'leanGain',
      tdeeKcal: 2700,
      tdeeSigmaKcal: 150,
      tdeeStatus: 'updated',
      targets: standardTargets,
      ...(leanGainPace === undefined ? {} : { leanGainPace }),
    });

  it('an intermediate lifter on lean gain at 0.15% chooses the slower gain: 0.075% a week, at once, inside the weekly step', () => {
    expect(standardTargets.weeklyRateFraction).toBe(0.0015);
    const s = setup('slower');
    const next = nextTargets({ setup: s, snapshot: snapshotFor(s), history: [last()], today });
    expect(next, 'not held for the check-in').toBeDefined();
    expect(next?.effectiveFrom).toBe(today);
    expect(next?.targets.weeklyRateFraction).toBeCloseTo(0.00075, 9);
    expect(next?.leanGainPace).toBe('slower');
    expect(next?.targets.kcal).toBeLessThan(standardTargets.kcal);
    expect(standardTargets.kcal - (next?.targets.kcal ?? 0)).toBeLessThanOrEqual(
      SafetyBounds.maxWeeklyTargetChange(standardTargets.kcal) + 1e-9,
    );
    expect(next?.tdeeKcal, 'on the estimate the current targets rest on').toBe(2700);
    expect(next?.explanation?.lines.some((line) => line.reason === 'paceChange')).toBe(true);
  });

  it('once the targets carry the pace, nothing changes before the check-in', () => {
    const s = setup('slower');
    expect(nextTargets({ setup: s, snapshot: snapshotFor(s), history: [last('slower')], today })).toBeUndefined();
  });

  it('going back to the standard pace applies at once too', () => {
    const s = setup('standard');
    const next = nextTargets({ setup: s, snapshot: snapshotFor(s), history: [last('slower')], today });
    expect(next?.targets.weeklyRateFraction).toBe(0.0015);
    expect(next?.leanGainPace).toBeUndefined();
  });

  it('the standard pace on a record made before the pace was kept is no change', () => {
    const s = setup('standard');
    expect(nextTargets({ setup: s, snapshot: snapshotFor(s), history: [last()], today })).toBeUndefined();
  });
});

describe('the offer', () => {
  const review = (init: Partial<ConstructorParameters<typeof LeanGainReview>[0]> = {}) =>
    new LeanGainReview({ startedOn: start, days: 70, intendedFraction: 0.0015, bodyFatPercent: 15, ...init });

  it('a fat-heavy gain is offered the slower pace beside maintenance', () => {
    const r = review({ fatHeavy: true });
    expect(r.offersSlowerGain).toBe(true);
    expect(r.offersGoalChange).toBe(true);
  });

  it('not when it is already slower, when it is time to end the gain, or when it is not fat-heavy', () => {
    expect(review({ fatHeavy: true, slowerPace: true }).offersSlowerGain).toBe(false);
    expect(review({ fatHeavy: true, slowerPace: true }).offersGoalChange).toBe(true);
    expect(review({ fatHeavy: true, stop: 'weeks' }).offersSlowerGain).toBe(false);
    expect(review({ gainingFast: true }).offersSlowerGain).toBe(false);
  });
});
