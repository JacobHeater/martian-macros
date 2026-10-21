import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  CoachingPolicy,
  EvidenceRegister,
  Exercise,
  type GoalMode,
  Profile,
  ScreeningAnswers,
  type TrainingStatus,
  WaistObservation,
} from '../../src/domain';
import {
  BodyFatEstimate,
  computeTargets,
  computeTargetsTraced,
  DailyTargets,
  type LeanGainReview,
  LeanGainRule,
  leanGainReviewOf,
  SafetyBounds,
  type StrengthPoint,
  StrengthTrend,
  TargetInputs,
  TargetsRecord,
  WeightTrendPoint,
} from '../../src/engine';
import { Fmt } from '../../src/format/Fmt';
import { leanGainReviewText } from '../../src/format/leanGainReviewText';
import { squat } from './support/squat';

/** MM-129: a lean gain that does not quietly become a bulk. */
const today = CalendarDate.of(2026, 10, 21);
const metric = new Fmt('metric');

/** What the review says, as one text. */
function said(review: LeanGainReview | undefined): string {
  if (review === undefined) throw new Error('No review.');
  return leanGainReviewText(review, metric).join(' ');
}

const policy = (screening = new ScreeningAnswers()) =>
  CoachingPolicy.derive({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 178 }),
    screening,
    today,
  });

const gain = ({
  status = 'intermediate',
  weightKg = 90,
  bodyFat = 20,
  tdee = 2800,
  previous,
  screening,
}: {
  status?: TrainingStatus;
  weightKg?: number;
  bodyFat?: number;
  tdee?: number;
  previous?: DailyTargets;
  screening?: ScreeningAnswers;
} = {}) =>
  new TargetInputs({
    sex: 'male',
    heightCm: 178,
    trendWeightKg: weightKg,
    bodyFat: new BodyFatEstimate({ percent: bodyFat, sigmaPercent: 2 }),
    mode: 'leanGain',
    trainingStatus: status,
    trainingDaysPerWeek: 4,
    policy: policy(screening),
    tdeeKcal: tdee,
    bmrKcal: 1850,
    previous,
  });

describe('the surplus cap', () => {
  it('an intermediate lifter with an expenditure of 2,800 on lean gain is never above 3,080', () => {
    for (const weightKg of [60, 80, 100, 130, 160]) {
      for (const bodyFat of [10, 20, 35]) {
        for (const screening of [new ScreeningAnswers(), new ScreeningAnswers({ androgenUse: true })]) {
          const t = computeTargets(gain({ weightKg, bodyFat, screening }));
          expect(t.kcal, `${weightKg} kg at ${bodyFat}%`).toBeLessThanOrEqual(3080 + 1e-9);
        }
      }
    }
  });

  it('caps a pace that asks for more, flags it and records the pace it gives', () => {
    // 0.25% a week at 130 kg and 35% asks about 370 kcal; 10% of 2,800 is 280.
    const t = computeTargets(gain({ weightKg: 130, bodyFat: 35, screening: new ScreeningAnswers({ androgenUse: true }) }));
    expect(t.kcal).toBeCloseTo(3080, 6);
    expect(t.flags.has('surplusCapped')).toBe(true);
    expect(t.weeklyRateFraction).toBeGreaterThan(0);
    expect(t.weeklyRateFraction).toBeLessThan(0.0025);
  });

  it('is 15% of expenditure for novices and returning lifters, and on measured expenditure', () => {
    for (const status of ['novice', 'returning', 'untrained'] as const) {
      const t = computeTargets(gain({ status, weightKg: 130, bodyFat: 35 }));
      expect(t.kcal, status).toBeCloseTo(2800 * 1.15, 6);
      expect(t.flags.has('surplusCapped')).toBe(true);
    }
    expect(SafetyBounds.maxSurplusKcal('advanced', 3200)).toBeCloseTo(320, 9);
  });

  it('leaves an ordinary gain alone', () => {
    const t = computeTargets(gain());
    expect(t.kcal).toBeGreaterThan(2800);
    expect(t.kcal).toBeLessThan(3080);
    expect(t.flags.has('surplusCapped')).toBe(false);
    expect(t.weeklyRateFraction).toBe(0.0015);
  });
});

it('gaining too fast: the lower expenditure the loop measured comes down by at most the weekly step', () => {
  const previous = new DailyTargets({ kcal: 3000, proteinG: 160, fatG: 85, carbsG: 330, weeklyRateFraction: 0.0015 });
  const { targets, trace } = computeTargetsTraced(gain({ tdee: 2500, previous }));
  expect(trace.formulaKcal).toBeLessThan(2900);
  expect(targets.kcal).toBe(3000 - SafetyBounds.maxWeeklyTargetChange(3000));
  expect(targets.flags.has('rateLimited')).toBe(true);
});

// The review.

const record = (daysAgo: number, mode: GoalMode = 'leanGain', rate = 0.0015) =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    mode,
    tdeeKcal: 2800,
    tdeeSigmaKcal: 150,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal: 2950, proteinG: 160, fatG: 80, carbsG: 330, weeklyRateFraction: rate }),
  });

/** On lean gain for `days`, a check-in every week, maintenance before. */
function onGainFor(days: number, rate = 0.0015): TargetsRecord[] {
  const records = [record(days + 28, 'maintenance', 0)];
  for (let d = days; d >= 0; d -= 7) records.push(record(d, 'leanGain', rate));
  return records;
}

/** A trend at `levelAt(daysAgo)` for the last 200 days. */
function trend(levelAt: (daysAgo: number) => number): WeightTrendPoint[] {
  const points: WeightTrendPoint[] = [];
  for (let daysAgo = 200; daysAgo >= 0; daysAgo--) {
    points.push(
      new WeightTrendPoint({
        date: today.addDays(-daysAgo),
        levelKg: levelAt(daysAgo),
        slopeKgPerDay: 0,
        waterKg: 0,
        levelVariance: 0.04,
        slopeVariance: 0.0001,
        observed: true,
        rejected: false,
      }),
    );
  }
  return points;
}

/** Linear from `fromKg` `days` ago to `toKg` today, flat before. */
const rising = (fromKg: number, toKg: number, days: number) =>
  trend((d) => (d >= days ? fromKg : fromKg + ((toKg - fromKg) * (days - d)) / days));

/** Weekly entries over `days`: `fromCm` for the first three, `toCm` for the last three, a line between. */
function waistOver(fromCm: number, toCm: number, days = 70): WaistObservation[] {
  const entries: WaistObservation[] = [];
  for (let d = days; d >= 0; d -= 7) {
    const cm = d >= days - 14 ? fromCm : d <= 14 ? toCm : fromCm + ((toCm - fromCm) * (days - 14 - d)) / (days - 28);
    entries.push(new WaistObservation({ date: today.addDays(-d), waistCm: cm }));
  }
  return entries;
}

/** A lift trained weekly for `days`, from `fromKg` to `toKg`. */
function lift(name: string, fromKg: number, toKg: number, days = 70): StrengthTrend {
  const points: StrengthPoint[] = [];
  for (let d = days + 1; d >= 1; d -= 7) {
    const kg = fromKg + ((toKg - fromKg) * (days + 1 - d)) / days;
    points.push({ workoutId: d, date: today.addDays(-d), estimateKg: kg, trendKg: kg });
  }
  return new StrengthTrend({
    exercise: new Exercise({ id: name, name, equipment: squat.equipment, primary: squat.primary }),
    exerciseId: name,
    loggedSessions: points.length,
    recentSessions: points.length,
    points,
  });
}

const review = ({
  days = 70,
  rate = 0.0015,
  history,
  trendPoints,
  waist = [],
  strength = [],
  bodyFatPercent = 15,
  weightSignals,
}: {
  days?: number;
  /** The pace the targets aim for: 0.35% (novice) keeps a 3 kg gain in ten weeks from also reading as too fast. */
  rate?: number;
  history?: TargetsRecord[];
  trendPoints?: WeightTrendPoint[];
  waist?: WaistObservation[];
  strength?: StrengthTrend[];
  bodyFatPercent?: number;
  weightSignals?: boolean;
} = {}) =>
  leanGainReviewOf({
    history: history ?? onGainFor(days, rate),
    trend: trendPoints ?? rising(80, 80.8, days),
    waist,
    strengthTrends: strength,
    sex: 'male',
    bodyFatPercent,
    today,
    ...(weightSignals === undefined ? {} : { weightSignals }),
  });

describe('the lean-gain review', () => {
  it('says nothing on another goal, or when nothing is wrong', () => {
    expect(review({ history: [record(70, 'recomp', -0.001)] })).toBeUndefined();
    expect(review()).toBeUndefined();
  });

  it('gaining too fast: 0.6% a week for three weeks against 0.15% is said, with both figures', () => {
    const r = review({ days: 35, trendPoints: rising(80, 80 * (1 + 0.018), 21) });
    expect(r?.gainingFast).toBe(true);
    expect(r?.gainFraction).toBeCloseTo(0.006, 9);
    expect(r?.offersGoalChange).toBe(false);
    expect(said(r)).toContain(
      'You are gaining about 0.6% a week; the aim is 0.15%. Beyond that pace, the extra is mostly fat.',
    );
  });

  it('not in the first weeks, when glycogen and water arrive with the food', () => {
    expect(review({ days: 21, trendPoints: rising(80, 81.44, 21) })).toBeUndefined();
  });

  it('fat-heavy: ten weeks, trend up 3 kg, waist up 4 cm over eleven entries, and a goal is offered', () => {
    const r = review({ rate: 0.0035, trendPoints: rising(80, 83, 70), waist: waistOver(86, 90) });
    expect(r?.fatHeavy).toBe(true);
    expect(r?.waistChangeCm).toBeCloseTo(4, 9);
    expect(r?.offersGoalChange).toBe(true);
    expect(r?.stop).toBeUndefined();
    expect(said(r)).toContain('The gain looks fat-heavy');
  });

  it('not fat-heavy with fewer than four waist entries', () => {
    const waist = waistOver(86, 90).filter((_, i, all) => i === 0 || i === 1 || i === all.length - 1);
    expect(review({ rate: 0.0035, trendPoints: rising(80, 83, 70), waist })?.fatHeavy ?? false).toBe(false);
  });

  it('waist within noise: up 0.8 cm over ten weeks is no notice', () => {
    expect(review({ rate: 0.0035, trendPoints: rising(80, 83, 70), waist: waistOver(86, 86.8) })).toBeUndefined();
  });

  it('not fat-heavy when the waist rose less than a centimeter a kilogram', () => {
    expect(review({ rate: 0.0035, trendPoints: rising(80, 84, 70), waist: waistOver(86, 89) })?.fatHeavy ?? false).toBe(false);
  });

  it('time to stop: estimated body fat at 20% for a man, with the reason, and the goal left alone', () => {
    const r = review({ bodyFatPercent: 20 });
    expect(r?.stop).toBe('bodyFat');
    expect(r?.offersGoalChange).toBe(true);
    const text = said(r);
    expect(text).toContain('Your estimated body fat has reached about 20%');
    expect(text).toContain('Your goal stays as it is until you change it.');
    expect(review({ bodyFatPercent: 19.4 })).toBeUndefined();
  });

  it('time to stop: the waist up 5% since the gain began, or 26 weeks on the goal', () => {
    expect(review({ trendPoints: rising(80, 86, 70), waist: waistOver(80, 84.5) })?.stop).toBe('waist');
    expect(review({ days: 182 })?.stop).toBe('weeks');
    expect(review({ days: 175 })).toBeUndefined();
  });

  it('weight up and strength flat: said, with no goal offered and no calorie change', () => {
    const strength = [lift('Back squat', 100, 100.5, 56), lift('Bench press', 80, 80, 56)];
    const r = review({ days: 56, rate: 0.0035, trendPoints: rising(80, 82, 56), strength });
    expect(r?.strengthFlat).toBe(true);
    expect(r?.liftsJudged).toBe(2);
    expect(r?.offersGoalChange).toBe(false);
    expect(said(r)).toContain('Calories stay as they are.');
  });

  it('strength flat is not said when a lift rose, or before eight weeks', () => {
    const rose = [lift('Back squat', 100, 104, 56)];
    expect(review({ days: 56, rate: 0.0035, trendPoints: rising(80, 82, 56), strength: rose })).toBeUndefined();
    const flat = [lift('Back squat', 100, 100, 49)];
    expect(review({ days: 49, rate: 0.0035, trendPoints: rising(80, 82, 49), strength: flat })).toBeUndefined();
  });

  it('an eating-disorder history hears only the weeks line', () => {
    expect(review({ bodyFatPercent: 25, weightSignals: false })).toBeUndefined();
    expect(review({ days: 182, bodyFatPercent: 25, weightSignals: false })?.stop).toBe('weeks');
  });
});

it('every lean-gain figure and the surplus cap have an evidence row', () => {
  const register = EvidenceRegister.parse(readFileSync('../../docs/evidence.md', 'utf8'));
  const registered = new Set(register.rows.map((row) => row.name));
  const expected = [
    ...Object.keys(LeanGainRule).map((name) => `LeanGainRule.${name}`),
    'SafetyBounds.maxSurplusKcal',
    'leanGainReviewOf',
  ];
  expect(expected.filter((name) => !registered.has(name))).toEqual([]);
});
