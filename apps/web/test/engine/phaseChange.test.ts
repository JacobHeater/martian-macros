import { describe, expect, it } from 'vitest';
import { CalendarDate, type IntakeDay, Profile, type WeightObservation } from '../../src/domain';
import {
  DailyTargets,
  energyDensityForSlope,
  initialTdeePrior,
  mifflinStJeorKcal,
  settlingDays,
  settlingShift,
  settlingWindows,
  TargetsRecord,
  type TdeeEstimate,
  TdeeEstimator,
  type TdeePrior,
  WeightTrendModel,
} from '../../src/engine';
import { runCoachLoop } from './support/runCoachLoop';
import { SyntheticUser } from './support/SyntheticUser';
import type { WeekResult } from './support/WeekResult';

/**
 * What happens to the trend, the expenditure estimate and the targets when
 * intake changes level and glycogen, water and gut contents move the scale
 * by a kilogram or two that is not tissue.
 */
const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 });
const day0 = CalendarDate.of(2026, 1, 1);

// The starting estimate for this person (light daily activity, three
// training days) is the truth, so any error comes from the weight data.
const startingEstimateKcal = initialTdeePrior({
  bmrKcal: mifflinStJeorKcal({ sex: profile.sex, weightKg: 85, heightCm: profile.heightCm, ageYears: profile.ageOn(day0) }),
  dailyActivity: 'light',
  trainingDaysPerWeek: 3,
}).kcal;

const user = (seed: number, glycogen = 0.02) =>
  new SyntheticUser({
    seed,
    baseTdeeKcal: startingEstimateKcal,
    startWeightKg: 85,
    bodyFatPercent: 22,
    skipLogProbability: 0.03,
    glycogenSwingFraction: glycogen,
  });

const mean = (values: readonly number[]) => values.reduce((a, b) => a + b) / values.length;

const record = (from: CalendarDate, kcal: number, tdee = 2600) =>
  new TargetsRecord({
    effectiveFrom: from,
    mode: 'fatLoss',
    tdeeKcal: tdee,
    tdeeSigmaKcal: 300,
    tdeeStatus: 'held',
    targets: new DailyTargets({ kcal, proteinG: 160, fatG: 70, carbsG: 200, weeklyRateFraction: -0.0075 }),
  });

describe('the simulated glycogen store', () => {
  it('adds 1 to 2 kg to the first ten days of a deficit, and gives it back at maintenance', () => {
    const person = user(1);
    for (let d = 0; d < 10; d++) {
      person.liveDay(2100);
    }
    expect(person.glycogenOffsetKg).toBeGreaterThanOrEqual(-2);
    expect(person.glycogenOffsetKg).toBeLessThanOrEqual(-1);
    for (let d = 0; d < 14; d++) {
      person.liveDay(person.trueTdeeKcal);
    }
    expect(Math.abs(person.glycogenOffsetKg)).toBeLessThan(0.4);
  });

  it('is off unless asked for, so existing seeds are unchanged', () => {
    const person = new SyntheticUser({ seed: 1 });
    for (let d = 0; d < 10; d++) {
      person.liveDay(2000);
    }
    expect(person.glycogenOffsetKg).toBe(0);
  });
});

describe('settling windows', () => {
  it('a first target well below expenditure opens one', () => {
    const windows = settlingWindows([record(day0, 2000)]);
    expect(windows).toHaveLength(1);
    expect(windows[0]?.start).toBe(day0);
    expect(windows[0]?.end).toBe(day0.addDays(settlingDays - 1));
  });

  it('a first target at maintenance does not', () => {
    expect(settlingWindows([record(day0, 2550)])).toEqual([]);
  });

  it('a weekly step does not, and leaving a deficit does', () => {
    const windows = settlingWindows([
      record(day0, 2000),
      record(day0.addDays(28), 1920),
      record(day0.addDays(84), 2500),
    ]);
    expect(windows.map((w) => w.start)).toEqual([day0, day0.addDays(84)]);
  });
});

describe('the estimator', () => {
  const estimator = new TdeeEstimator();
  const prior: TdeePrior = { kcal: 2640, sigmaKcal: 396 };

  function estimateOn(day: number, settle: boolean): TdeeEstimate {
    const person = user(7);
    const intake: IntakeDay[] = [];
    const weights: WeightObservation[] = [];
    for (let d = 0; d < day; d++) {
      const lived = person.liveDay(2000);
      if (lived.intake !== undefined) intake.push(lived.intake);
      if (lived.weight !== undefined) weights.push(lived.weight);
    }
    const asOf = person.today.addDays(-1);
    const settling = settle ? settlingWindows([record(day0, 2000, 2640)]) : [];
    return estimator.estimate({
      asOf,
      intake,
      trend: new WeightTrendModel().smooth(weights, { through: asOf, shift: settlingShift(settling, 85) }),
      prior,
      bmrKcal: 1820,
      energyDensityForSlope: (slope) =>
        energyDensityForSlope({ slopeKgPerDay: slope, fatMassKg: person.fatMassKg, resistanceTrained: true }),
      settling,
    });
  }

  it('holds, and says until when, while too few days are left outside the window', () => {
    const estimate = estimateOn(20, true);
    expect(estimate.status).toBe('held');
    expect(estimate.kcal).toBe(prior.kcal);
    expect(estimate.settlingUntil).toBe(day0.addDays(settlingDays - 1));
  });

  it('measures once fourteen days lie outside it, using only those days', () => {
    const estimate = estimateOn(28, true);
    expect(estimate.status).toBe('updated');
    expect(estimate.usableIntakeDays).toBeLessThanOrEqual(18);
    expect(estimate.settlingUntil).toBeUndefined();
  });

  it('without a window, behaves as before', () => {
    expect(estimateOn(20, false).status).toBe('updated');
  });
});

describe('starting a deficit', () => {
  function run({ glycogen, settle }: { glycogen: number; settle: boolean }): {
    firstError: number;
    coverage: number;
    firstWeek: number;
  } {
    const firstErrors: number[] = [];
    const firstWeeks: number[] = [];
    let covered = 0;
    let total = 0;
    for (let seed = 100; seed < 140; seed++) {
      const weeks = runCoachLoop({ user: user(seed, glycogen), profile, mode: 'fatLoss', weeks: 10, settle });
      const measured = weeks.filter((w) => w.tdee.status === 'updated');
      for (const w of measured) {
        total++;
        if (Math.abs(w.tdee.kcal - w.trueTdeeKcal) <= 2 * w.tdee.sigmaKcal) {
          covered++;
        }
      }
      const first = measured[0] as WeekResult;
      firstErrors.push(first.tdee.kcal - first.trueTdeeKcal);
      firstWeeks.push(first.week);
    }
    return { firstError: mean(firstErrors), coverage: covered / total, firstWeek: mean(firstWeeks) };
  }

  it('the defect: without settling, the first measurement is far too high and its uncertainty is not honest', () => {
    const broken = run({ glycogen: 0.02, settle: false });
    expect(broken.firstError).toBeGreaterThan(250);
    expect(broken.coverage).toBeLessThan(0.85);
  });

  it('with settling, the first measurement is close and the uncertainty is honest', () => {
    const fixed = run({ glycogen: 0.02, settle: true });
    const noGlycogen = run({ glycogen: 0, settle: true });
    expect(Math.abs(fixed.firstError)).toBeLessThan(125);
    // What the glycogen shift itself still contributes.
    expect(fixed.firstError - noGlycogen.firstError).toBeLessThan(100);
    expect(fixed.coverage).toBeGreaterThanOrEqual(0.85);
    expect(noGlycogen.coverage).toBeGreaterThanOrEqual(0.85);
    // The price: the first measurement waits for 14 days outside the
    // window, so it arrives at the day-28 check-in.
    expect(fixed.firstWeek).toBe(4);
  });
});

describe('ending a deficit', () => {
  /** Mean of (target - true expenditure) over forty users, per week. */
  function targetError({ glycogen, settle }: { glycogen: number; settle: boolean }): Map<number, number> {
    const byWeek = new Map<number, number[]>();
    for (let seed = 200; seed < 240; seed++) {
      const weeks = runCoachLoop({
        user: user(seed, glycogen),
        profile,
        mode: 'fatLoss',
        weeks: 17,
        settle,
        modeAt: (w) => (w < 12 ? 'fatLoss' : 'maintenance'),
      });
      for (let w = 12; w <= 16; w++) {
        const week = weeks[w] as WeekResult;
        const errors = byWeek.get(w) ?? [];
        errors.push(week.targets.kcal - week.trueTdeeKcal);
        byWeek.set(w, errors);
      }
    }
    return new Map([...byWeek].map(([week, errors]) => [week, mean(errors)]));
  }

  const worst = (errors: ReadonlyMap<number, number>) => Math.max(...[...errors.values()].map((e) => Math.abs(e)));

  it('maintenance targets stay near true expenditure for the four weeks after', () => {
    expect(worst(targetError({ glycogen: 0.02, settle: true }))).toBeLessThan(100);
  });

  it('the defect: without settling, and with no glycogen rebound to mask it, the trend goes on losing and targets climb', () => {
    const broken = targetError({ glycogen: 0, settle: false });
    expect(broken.get(16)).toBeGreaterThan(250);
    expect(worst(targetError({ glycogen: 0, settle: true }))).toBeLessThan(175);
  });
});
