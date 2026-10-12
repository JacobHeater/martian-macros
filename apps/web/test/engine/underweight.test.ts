import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  CoachingPolicy,
  type GoalMode,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightObservation,
} from '../../src/domain';
import {
  analyze,
  BodyFatEstimate,
  type CoachSnapshot,
  computeTargets,
  DailyTargets,
  nextTargets,
  type TargetFlag,
  TargetInputs,
  TargetsRecord,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';
import { deficitStartingOn } from './support/trendPoints';

/**
 * MM-111 in the engine: the pace limit, the end of a deficit, and the body
 * weight the rule is judged on.
 */
const start = CalendarDate.of(2026, 1, 1);

const setup = ({ mode = 'fatLoss', onboardedOn }: { mode?: GoalMode; onboardedOn: CalendarDate }) =>
  new UserSetup({
    profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(1992, 4, 20), heightCm: 170 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'novice',
    trainingDaysPerWeek: 3,
    goalMode: mode,
    onboardedOn,
  });

/**
 * One weigh-in a day for `days` days from `start`, at `weightKg` (with an
 * optional `dip` of one day, in kg, at day `dipDay`).
 */
const weighIns = (
  days: number,
  weightKg: number,
  { dipDay, dip = 0 }: { dipDay?: number; dip?: number } = {},
): WeightObservation[] =>
  upTo(days).map((d) => ({ date: start.addDays(d), weightKg: weightKg - (d === dipDay ? dip : 0) }));

const snapshot = (s: UserSetup, weights: WeightObservation[]) =>
  analyze({ setup: s, weights, intake: [], today: start.addDays(weights.length) }) as CoachSnapshot;

describe('what the engine judges body weight on', () => {
  const s = setup({ onboardedOn: start });

  it('a sustained weight below BMI 18.5 removes the deficit goals', () => {
    // 170 cm and 53 kg is BMI 18.3.
    const snap = snapshot(s, weighIns(21, 53));
    expect(snap.policy.underweight).toBe(true);
    expect(snap.recommendation.mode).toBe('maintenance');
    expect(snap.recommendation.reason).toBe('underweight');
  });

  it('one low reading changes nothing', () => {
    // BMI 18.9 is 54.6 kg; one reading of 52.9 kg would be BMI 18.3.
    const snap = snapshot(s, weighIns(21, 54.6, { dipDay: 20, dip: 1.7 }));
    expect(snap.policy.underweight).toBe(false);
    expect(snap.policy.allowedModes).toContain('fatLoss');
  });

  it('at BMI 24 the rule changes nothing', () => {
    const snap = snapshot(s, weighIns(21, 69.4));
    expect(snap.policy.underweight).toBe(false);
    expect(snap.policy.maxWeeklyLossFraction).toBeUndefined();
  });
});

describe('targets', () => {
  const inputs = ({
    policy,
    mode = 'fatLoss',
    previous,
  }: {
    policy: CoachingPolicy;
    mode?: GoalMode;
    previous?: DailyTargets;
  }) =>
    new TargetInputs({
      sex: 'female',
      heightCm: 170,
      trendWeightKg: 62,
      bodyFat: new BodyFatEstimate({ percent: 30, sigmaPercent: 3 }),
      mode,
      trainingStatus: 'novice',
      policy,
      tdeeKcal: 2300,
      bmrKcal: 1400,
      previous,
    });

  const policyAt = (weightKg: number) =>
    CoachingPolicy.derive({
      profile: new Profile({ sex: 'female', birthDate: CalendarDate.of(1992, 4, 20), heightCm: 170 }),
      screening: new ScreeningAnswers(),
      today: start,
      weightKg,
    });

  it('in the caution zone fat loss runs at no more than 0.5% a week', () => {
    // 170 cm and 57 kg is BMI 19.7.
    const t = computeTargets(inputs({ policy: policyAt(57) }));
    expectClose(t.weeklyRateFraction, -0.005, 1e-12);
    const normal = computeTargets(inputs({ policy: policyAt(70) }));
    expectClose(normal.weeklyRateFraction, -0.0075, 1e-12);
  });

  it('a deficit becomes maintenance at once, flagged and not step-limited', () => {
    const deficit = computeTargets(inputs({ policy: policyAt(70) }));
    const t = computeTargets(inputs({ policy: policyAt(53), previous: deficit }));
    expect(t.weeklyRateFraction).toBe(0);
    expect(t.flags).toContain('underweightMaintenance');
    expect(t.flags).not.toContain('rateLimited');
    expect(t.kcal - deficit.kcal).toBeGreaterThan(100);
  });
});

describe('check-in', () => {
  it('a deficit ends at the next check-in, even during calibration', () => {
    const s = setup({ onboardedOn: start.addDays(20) });
    const snap = snapshot(s, weighIns(28, 53));
    const first = new TargetsRecord({
      effectiveFrom: start,
      mode: 'fatLoss',
      tdeeKcal: 1850,
      tdeeSigmaKcal: 250,
      tdeeStatus: 'held',
      targets: new DailyTargets({ kcal: 1450, proteinG: 110, fatG: 50, carbsG: 170, weeklyRateFraction: -0.0075 }),
    });
    const next = nextTargets({ setup: s, snapshot: snap, history: [first], today: start.addDays(28) });
    expect(next, 'calibration does not delay this').toBeDefined();
    expect(next?.mode).toBe('maintenance');
    expect(next?.targets.weeklyRateFraction).toBe(0);
    expect(next?.targets.flags).toContain('underweightMaintenance');
    expect((next?.targets.kcal ?? 0) - first.targets.kcal).toBeGreaterThan(100);
  });

  it('not before the weekly check-in is due', () => {
    const s = setup({ onboardedOn: start.addDays(20) });
    const snap = snapshot(s, weighIns(28, 53));
    expect(
      nextTargets({
        setup: s,
        snapshot: snap,
        history: [deficitStartingOn(start.addDays(25))],
        today: start.addDays(28),
      }),
    ).toBeUndefined();
  });

  it('a forced maintenance record is not rewritten every check-in while the stored goal is still a deficit', () => {
    const s = setup({ onboardedOn: start.addDays(20) });
    const snap = snapshot(s, weighIns(35, 53));
    const forced = new TargetsRecord({
      effectiveFrom: start.addDays(28),
      mode: 'maintenance',
      tdeeKcal: 1850,
      tdeeSigmaKcal: 250,
      tdeeStatus: 'held',
      targets: new DailyTargets({
        kcal: 1850,
        proteinG: 110,
        fatG: 55,
        carbsG: 230,
        weeklyRateFraction: 0,
        flags: new Set<TargetFlag>(['underweightMaintenance']),
      }),
    });
    expect(nextTargets({ setup: s, snapshot: snap, history: [forced], today: start.addDays(30) })).toBeUndefined();
  });

  it('a user already at maintenance is left alone', () => {
    const s = setup({ mode: 'maintenance', onboardedOn: start.addDays(20) });
    const snap = snapshot(s, weighIns(28, 53));
    const maintenance = new TargetsRecord({
      effectiveFrom: start,
      mode: 'maintenance',
      tdeeKcal: 2400,
      tdeeSigmaKcal: 300,
      tdeeStatus: 'held',
      targets: new DailyTargets({ kcal: 2400, proteinG: 110, fatG: 70, carbsG: 300, weeklyRateFraction: 0 }),
    });
    // Calibration still holds the ordinary path, so nothing changes.
    expect(
      nextTargets({ setup: s, snapshot: snap, history: [maintenance], today: start.addDays(28) }),
    ).toBeUndefined();
  });
});
