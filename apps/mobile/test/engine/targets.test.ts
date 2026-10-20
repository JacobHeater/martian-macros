import { describe, expect, it } from 'vitest';
import {
  BiologicalSex,
  CalendarDate,
  CoachingPolicy,
  type GoalMode,
  Profile,
  ScreeningAnswers,
  type TrainingStatus,
} from '../../src/domain';
import {
  BodyFatEstimate,
  type BreakFlag,
  computeTargets,
  type DailyTargets,
  DietBreakRule,
  SafetyBounds,
  TargetInputs,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';

const today = CalendarDate.of(2026, 10, 5);

const policyFor = (sex: BiologicalSex, screening: ScreeningAnswers = new ScreeningAnswers()) =>
  CoachingPolicy.derive({
    profile: new Profile({ sex, birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening,
    today,
  });

const inputs = ({
  sex = 'male',
  mode = 'fatLoss',
  weightKg = 90,
  heightCm = 178,
  bodyFat = 25,
  tdee = 2800,
  bmr = 1850,
  previous,
  deficitWeeks = 0,
  policy,
  status = 'intermediate',
  requestedLoss,
  safetyRaise = 0,
  safetyBodyFat,
  trainingDaysPerWeek = 3,
  breakRequested = false,
  continuingBreak,
}: {
  sex?: BiologicalSex;
  mode?: GoalMode;
  weightKg?: number;
  heightCm?: number;
  bodyFat?: number;
  tdee?: number;
  bmr?: number;
  previous?: DailyTargets;
  deficitWeeks?: number;
  policy?: CoachingPolicy;
  status?: TrainingStatus;
  requestedLoss?: number;
  safetyRaise?: number;
  safetyBodyFat?: number;
  trainingDaysPerWeek?: number;
  breakRequested?: boolean;
  continuingBreak?: BreakFlag;
} = {}) =>
  new TargetInputs({
    sex,
    heightCm,
    trendWeightKg: weightKg,
    bodyFat: new BodyFatEstimate({ percent: bodyFat, sigmaPercent: 2 }),
    mode,
    trainingStatus: status,
    trainingDaysPerWeek,
    policy: policy ?? policyFor(sex),
    tdeeKcal: tdee,
    bmrKcal: bmr,
    previous,
    consecutiveDeficitWeeks: deficitWeeks,
    requestedLossFraction: requestedLoss,
    safetyBodyFatPercent: safetyBodyFat,
    safetyRaiseKcal: safetyRaise,
    breakRequested,
    continuingBreak,
  });

describe('SafetyBounds', () => {
  it('absolute floors differ by sex', () => {
    expect(SafetyBounds.absoluteFloorKcal('male')).toBe(1500);
    expect(SafetyBounds.absoluteFloorKcal('female')).toBe(1200);
  });

  it('energy availability dominates the floor for lean users only', () => {
    const floor = (bodyFat: number) =>
      SafetyBounds.calorieFloorKcal({
        sex: 'male',
        bmrKcal: 1700,
        bodyFatPercent: bodyFat,
        fatFreeMassUpperKg: 65,
        trainingKcalPerDay: 300,
      });
    expect(floor(12)).toBe(30 * 65 + 300);
    expect(floor(25)).toBe(1700);
  });

  it('maximum loss rate tapers as users get leaner', () => {
    expect(SafetyBounds.maxWeeklyLossFraction('male', 25)).toBe(0.01);
    expect(SafetyBounds.maxWeeklyLossFraction('male', 13)).toBe(0.007);
    expect(SafetyBounds.maxWeeklyLossFraction('male', 10)).toBe(0.005);
    expect(SafetyBounds.maxWeeklyLossFraction('female', 24)).toBe(0.007);
  });

  it('goal body fat floors are sex-specific', () => {
    expect(SafetyBounds.checkGoalBodyFat('male', 9)).toBe('warnAndTimeLimit');
    expect(SafetyBounds.checkGoalBodyFat('male', 7)).toBe('rejected');
    expect(SafetyBounds.checkGoalBodyFat('female', 12)).toBe('rejected');
    expect(SafetyBounds.checkGoalBodyFat('female', 20)).toBe('accepted');
  });

  it('protein uses fat-free mass when lean and dieting', () => {
    const range = SafetyBounds.proteinRangeG({
      sex: 'male',
      weightKg: 80,
      heightCm: 180,
      bodyFatPercent: 12,
      inDeficit: true,
    });
    expectClose(range.minG, 2.3 * 70.4, 1e-9);
    expectClose(range.maxG, 3.1 * 70.4, 1e-9);
  });

  const proteinTarget = (
    weightKg: number,
    { heightCm = 180, sex = 'male' }: { heightCm?: number; sex?: BiologicalSex } = {},
  ) => SafetyBounds.proteinRangeG({ sex, weightKg, heightCm, bodyFatPercent: 35, inDeficit: true }).midG;

  it('reference weight is body weight up to BMI 25, then a quarter of the excess', () => {
    const reference = (kg: number) => SafetyBounds.referenceWeightKg({ weightKg: kg, heightCm: 180 });
    expect(reference(70)).toBe(70);
    expectClose(reference(81), 81, 1e-9);
    expectClose(reference(121), 91, 1e-9);
  });

  it('protein is unchanged at a healthy weight', () => {
    const range = SafetyBounds.proteinRangeG({
      sex: 'male',
      weightKg: 77.8, // BMI 24 at 180 cm
      heightCm: 180,
      bodyFatPercent: 20,
      inDeficit: false,
    });
    expectClose(range.minG, 1.6 * 77.8, 1e-9);
    expectClose(range.maxG, 2.2 * 77.8, 1e-9);
  });

  it('goal and training choose the protein minimum and target', () => {
    const cut = computeTargets(inputs({ weightKg: 80, heightCm: 180, bodyFat: 20 }));
    expectClose(cut.proteinMinimumG, 128, 1e-9);
    expectClose(cut.proteinG, 160, 1e-9);

    const maintenance = computeTargets(inputs({ weightKg: 80, heightCm: 180, bodyFat: 20, mode: 'maintenance' }));
    expectClose(maintenance.proteinG, 144, 1e-9);

    const leanGain = computeTargets(inputs({ weightKg: 80, heightCm: 180, bodyFat: 20, mode: 'leanGain' }));
    expectClose(leanGain.proteinMinimumG, 128, 1e-9);
    expectClose(leanGain.proteinG, 144, 1e-9);

    const notLifting = computeTargets(
      inputs({ weightKg: 80, heightCm: 180, bodyFat: 20, status: 'untrained', trainingDaysPerWeek: 0 }),
    );
    expectClose(notLifting.proteinMinimumG, 96, 1e-9);
    expectClose(notLifting.proteinG, 128, 1e-9);
  });

  it('the senior protein floor reaches targets unless kidney-capped', () => {
    const policy = CoachingPolicy.derive({
      profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1959, 1, 1), heightCm: 180 }),
      screening: new ScreeningAnswers(),
      today,
      weightKg: 80,
    });
    const targets = computeTargets(
      inputs({
        weightKg: 80,
        heightCm: 180,
        bodyFat: 20,
        mode: 'maintenance',
        status: 'untrained',
        trainingDaysPerWeek: 0,
        policy,
      }),
    );
    expectClose(targets.proteinMinimumG, 96, 1e-9);
    expectClose(targets.proteinG, 128, 1e-9);
  });

  it('protein minimum defines meeting the target without an upper limit', () => {
    const targets = computeTargets(inputs({ weightKg: 80, heightCm: 180, bodyFat: 20 }));
    expect(targets.meetsProteinMinimum(127)).toBe(false);
    expect(targets.meetsProteinMinimum(135)).toBe(true);
    expect(targets.meetsProteinMinimum(230)).toBe(true);
    expect(targets.flags.size).toBe(0);
  });

  it('kidney cap overrides the age floor and sets both values', () => {
    const policy = CoachingPolicy.derive({
      profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1959, 1, 1), heightCm: 180 }),
      screening: new ScreeningAnswers({ chronicKidneyDisease: true }),
      today,
      weightKg: 80,
    });
    const targets = computeTargets(
      inputs({ weightKg: 80, heightCm: 180, bodyFat: 20, mode: 'maintenance', policy }),
    );
    expect(targets.proteinMinimumG).toBe(64);
    expect(targets.proteinG).toBe(64);
    expect(targets.flags).toContain('proteinCapped');
  });

  it('lean deficit interpolation avoids a target cliff', () => {
    let previous = 0;
    for (let bodyFat = 19; bodyFat >= 14; bodyFat -= 1) {
      const weight = 80 - (19 - bodyFat) * 0.5;
      const targets = computeTargets(inputs({ weightKg: weight, bodyFat, safetyBodyFat: bodyFat }));
      if (previous > 0) {
        expect(Math.abs(targets.proteinG - previous)).toBeLessThanOrEqual(10);
      }
      previous = targets.proteinG;
    }
  });

  it('lean deficit interpolation uses the specified target points', () => {
    const expectedTargets = [160.0, 164.2133333333, 169.8133333333, 176.8];
    expectedTargets.forEach((expected, index) => {
      const bodyFat = 18 - index;
      const targets = computeTargets(inputs({ weightKg: 80, heightCm: 180, bodyFat, safetyBodyFat: bodyFat }));
      expectClose(targets.proteinG, expected, 1e-8);
    });
  });

  it('protein does not step at BMI 30', () => {
    expect(Math.abs(proteinTarget(97.3) - proteinTarget(96.9))).toBeLessThan(2);
  });

  it('protein is continuous and never falls as weight rises', () => {
    for (const sex of BiologicalSex.values) {
      for (let heightCm = 150; heightCm <= 200; heightCm += 10) {
        const heightM = heightCm / 100;
        let previous = 0;
        for (let kg = 18 * heightM * heightM; kg <= 50 * heightM * heightM; kg += 0.5) {
          const target = proteinTarget(kg, { heightCm, sex });
          if (previous > 0) {
            expect(target).toBeGreaterThanOrEqual(previous);
            expect(target - previous).toBeLessThan(2);
          }
          previous = target;
        }
      }
    }
  });

  it('protein stays sensible at a high weight', () => {
    expect(proteinTarget(140)).toBeGreaterThanOrEqual(150);
    expect(proteinTarget(140)).toBeLessThanOrEqual(200);
  });

  it('the fat minimum uses the same reference weight', () => {
    const fat = SafetyBounds.minFatG({ sex: 'male', weightKg: 121, heightCm: 180, kcal: 1500 });
    expectClose(fat, 0.5 * 91, 1e-9);
  });

  it('kidney-disease cap overrides protein', () => {
    const range = SafetyBounds.proteinRangeG({
      sex: 'male',
      weightKg: 80,
      heightCm: 180,
      bodyFatPercent: 20,
      inDeficit: false,
      capGPerKg: 0.8,
    });
    expect(range.maxG).toBe(64);
  });

  it('weekly change is the smaller of 100 kcal and 5%', () => {
    expect(SafetyBounds.maxWeeklyTargetChange(2400)).toBe(100);
    expect(SafetyBounds.maxWeeklyTargetChange(1600)).toBe(80);
  });
});

describe('computeTargets', () => {
  it('fat loss sets a deficit and macros that add up', () => {
    const t = computeTargets(inputs());
    expect(t.kcal).toBeLessThan(2800);
    expect(t.weeklyRateFraction).toBe(-0.0075);
    expectClose(4 * t.proteinG + 4 * t.carbsG + 9 * t.fatG, t.kcal, 1);
    expect(t.flags.size).toBe(0);
  });

  it('caps the requested loss pace at the safety maximum', () => {
    // 14.5% with a 2-point deviation is clearly in the 12% to 15% band.
    const t = computeTargets(inputs({ bodyFat: 14.5, requestedLoss: 0.01 }));
    expect(t.weeklyRateFraction).toBe(-0.007);
  });

  it('never emits a target below the floor', () => {
    const t = computeTargets(inputs({ sex: 'female', weightKg: 55, bodyFat: 30, tdee: 1250 }));
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
    expect(t.flags).toContain('flooredAtSafetyMinimum');
  });

  it('limits the weekly change', () => {
    const first = computeTargets(inputs({ tdee: 2800 }));
    const next = computeTargets(inputs({ tdee: 2300, previous: first }));
    expectClose(first.kcal - next.kcal, 100, 1e-9);
    expect(next.flags).toContain('rateLimited');
  });

  it('a safety raise is not step-limited, and is flagged', () => {
    const first = computeTargets(inputs({ tdee: 2800 }));
    const raised = computeTargets(inputs({ tdee: 2800, previous: first, safetyRaise: 300 }));
    expectClose(raised.kcal, first.kcal + 300, 1e-9);
    expect(raised.flags).toContain('raisedForSafePace');
    expect(raised.flags).not.toContain('rateLimited');
  });

  it('a safety raise never lowers a target the formula already raised', () => {
    const first = computeTargets(inputs({ tdee: 2400 }));
    const plain = computeTargets(inputs({ tdee: 3300, previous: first }));
    const raised = computeTargets(inputs({ tdee: 3300, previous: first, safetyRaise: 50 }));
    // The ordinary step (+100) is already above first + 50.
    expectClose(raised.kcal, plain.kcal, 1e-9);
    expect(raised.flags).not.toContain('raisedForSafePace');
  });

  it('reductions are still limited when no raise applies', () => {
    const first = computeTargets(inputs({ tdee: 2800 }));
    const next = computeTargets(inputs({ tdee: 2000, previous: first }));
    expectClose(first.kcal - next.kcal, 100, 1e-9);
  });

  it('the week after a safety raise does not lower the target', () => {
    const first = computeTargets(inputs({ tdee: 2800 }));
    const raised = computeTargets(inputs({ tdee: 2800, previous: first, safetyRaise: 300 }));
    // The formula now wants less than the raised target.
    const after = computeTargets(inputs({ tdee: 2400, previous: raised }));
    expect(after.kcal).toBe(raised.kcal);
    expect(after.flags).toContain('heldAfterSafetyRaise');
    // The hold lasts one check-in; the week after, the ordinary limit
    // applies again.
    const later = computeTargets(inputs({ tdee: 2400, previous: after }));
    expectClose(after.kcal - later.kcal, 100, 1e-9);
    expect(later.flags).not.toContain('heldAfterSafetyRaise');
  });

  it('a diet break returns calories at once, not 100 at a time', () => {
    const deficit = computeTargets(inputs());
    const onBreak = computeTargets(inputs({ previous: deficit, deficitWeeks: DietBreakRule.forceFromWeeks }));
    expect(onBreak.flags).toContain('dietBreak');
    expectClose(onBreak.kcal, 2800, 1e-9);
    expect(onBreak.kcal - deficit.kcal).toBeGreaterThan(100);
  });

  // MM-135 (2026-10-20): the break MM-31 forced at sixteen weeks is offered at twelve and planned only at twenty.
  it('plans a diet break at 20 deficit weeks, and not at 16', () => {
    const t = computeTargets(inputs({ deficitWeeks: 20 }));
    expect(t.weeklyRateFraction).toBe(0);
    expectClose(t.kcal, 2800, 1e-9);
    expect(t.flags).toContain('dietBreak');
    expect(DietBreakRule.forceFromWeeks).toBe(20);
    const sixteen = computeTargets(inputs({ deficitWeeks: 16 }));
    expect(sixteen.weeklyRateFraction).toBeLessThan(0);
    expect(sixteen.flags).not.toContain('dietBreak');
  });

  it('a break still running keeps targets reissued inside it at maintenance, under the same flag', () => {
    for (const flag of ['dietBreak', 'requestedBreak'] as const) {
      const t = computeTargets(inputs({ deficitWeeks: 0, continuingBreak: flag }));
      expect(t.weeklyRateFraction, flag).toBe(0);
      expect(t.flags, flag).toContain(flag);
    }
    const chosen = computeTargets(inputs({ breakRequested: true, continuingBreak: 'dietBreak' }));
    expect(chosen.flags, 'a new request outranks a continuation').toContain('requestedBreak');
    expect(chosen.flags).not.toContain('dietBreak');
  });

  it('falls back to maintenance when the mode is not allowed', () => {
    const t = computeTargets(
      inputs({ sex: 'female', policy: policyFor('female', new ScreeningAnswers({ breastfeeding: true })) }),
    );
    expect(t.flags).toContain('modeNotAllowed');
    expect(t.weeklyRateFraction).toBe(0);
    expectClose(t.kcal, 2800 + 400, 1e-9);
  });

  it('lean gain is faster for novices than intermediates', () => {
    const novice = computeTargets(inputs({ mode: 'leanGain', status: 'novice' }));
    const intermediate = computeTargets(inputs({ mode: 'leanGain' }));
    expect(novice.kcal).toBeGreaterThan(intermediate.kcal);
    expect(intermediate.kcal).toBeGreaterThan(2800);
  });

  it('recomp is a small deficit, larger at high body fat', () => {
    const high = computeTargets(inputs({ mode: 'recomp', bodyFat: 24 }));
    const low = computeTargets(inputs({ mode: 'recomp', bodyFat: 16 }));
    expect(high.weeklyRateFraction).toBe(-0.0025);
    expect(low.weeklyRateFraction).toBe(-0.001);
    expect(2800 - high.kcal).toBeLessThan(400);
  });
});
