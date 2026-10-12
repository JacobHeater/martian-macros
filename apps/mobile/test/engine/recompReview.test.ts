import { describe, expect, it } from 'vitest';
import { CalendarDate, Exercise, type GoalMode, WaistObservation } from '../../src/domain';
import {
  DailyTargets,
  type ModeRecommendation,
  RecompMeasure,
  recompReviewOf,
  type StrengthPoint,
  StrengthTrend,
  TargetsRecord,
  WeightTrendPoint,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { squat } from './support/squat';

/** MM-133: an honest review of a stretch on recomp. */
const today = CalendarDate.of(2026, 10, 11);

const eligible: ModeRecommendation = { mode: 'recomp', reason: 'recompEligible' };
const lean: ModeRecommendation = { mode: 'leanGain', reason: 'leanAndTrained' };
const cutFirst: ModeRecommendation = { mode: 'fatLoss', reason: 'cutFirst' };

const record = (daysAgo: number, mode: GoalMode = 'recomp') =>
  new TargetsRecord({
    effectiveFrom: today.addDays(-daysAgo),
    mode,
    tdeeKcal: 2500,
    tdeeSigmaKcal: 150,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal: 2400, proteinG: 160, fatG: 70, carbsG: 250, weeklyRateFraction: -0.001 }),
  });

/** On recomp for `days`, with a check-in every week. */
function onRecompFor(days: number): TargetsRecord[] {
  const records: TargetsRecord[] = [];
  for (let d = days; d >= 0; d -= 7) records.push(record(d));
  return records;
}

/** A trend that went from `fromKg` to `toKg` over the last `days`. */
function trend(fromKg: number, toKg: number, days = 84): WeightTrendPoint[] {
  const points: WeightTrendPoint[] = [];
  for (let daysAgo = 120; daysAgo >= 0; daysAgo--) {
    points.push(
      new WeightTrendPoint({
        date: today.addDays(-daysAgo),
        levelKg: daysAgo >= days ? fromKg : fromKg + ((toKg - fromKg) * (days - daysAgo)) / days,
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

/** Weekly waist entries over `days`, from `fromCm` to `toCm`. */
function waistOver(fromCm: number, toCm: number, days = 84): WaistObservation[] {
  const entries: WaistObservation[] = [];
  for (let d = days; d >= 0; d -= 7) {
    entries.push(
      new WaistObservation({ date: today.addDays(-d), waistCm: fromCm + ((toCm - fromCm) * (days - d)) / days }),
    );
  }
  return entries;
}

/** A lift trained weekly for `days`, from `fromKg` to `toKg`. */
function lift(
  name: string,
  fromKg: number,
  toKg: number,
  { days = 84, lastDaysAgo = 0, everyDays = 7 }: { days?: number; lastDaysAgo?: number; everyDays?: number } = {},
): StrengthTrend {
  const points: StrengthPoint[] = [];
  for (let d = days; d >= lastDaysAgo; d -= everyDays) {
    const kg = fromKg + ((toKg - fromKg) * (days - d)) / days;
    points.push({ workoutId: d + 1, date: today.addDays(-d), estimateKg: kg, trendKg: kg });
  }
  const sessions = Math.trunc(days / everyDays) + 1;
  return new StrengthTrend({
    exercise: new Exercise({ id: name, name, equipment: squat.equipment, primary: squat.primary }),
    exerciseId: name,
    loggedSessions: sessions,
    recentSessions: sessions,
    points,
  });
}

const lifts = (percent: number, days = 84) => [
  lift('Back squat', 100, 100 * (1 + percent / 100), { days }),
  lift('Barbell row', 60, 60 * (1 + percent / 100), { days }),
];

const review = ({
  days = 84,
  history,
  trendPoints,
  waist,
  strength,
  recommendation = eligible,
}: {
  days?: number;
  history?: TargetsRecord[];
  trendPoints?: WeightTrendPoint[];
  waist?: WaistObservation[];
  strength?: StrengthTrend[];
  recommendation?: ModeRecommendation;
} = {}) =>
  recompReviewOf({
    history: history ?? onRecompFor(days),
    trend: trendPoints ?? trend(82, 81.6, days),
    waist: waist ?? waistOver(92, 89, days),
    strengthTrends: strength ?? lifts(6, days),
    recommendation,
    today,
  });

describe('when a review is due', () => {
  it('not before eight weeks on recomp', () => {
    expect(review({ days: 55 })).toBeUndefined();
  });

  it('at eight weeks, for two weeks', () => {
    expect(review({ days: 56 })?.week).toBe(8);
    expect(review({ days: 69 })?.week).toBe(8);
    expect(review({ days: 70 })).toBeUndefined();
  });

  it('at twelve weeks, then every eight', () => {
    expect(review({ days: 84 })?.week).toBe(12);
    expect(review({ days: 98 })).toBeUndefined();
    expect(review({ days: 140 })?.week).toBe(20);
    expect(review({ days: 196 })?.week).toBe(28);
  });

  it('not on another goal', () => {
    expect(review({ history: [record(84), record(0, 'fatLoss')] })).toBeUndefined();
    expect(review({ history: [] })).toBeUndefined();
  });

  it('the weeks count from the last change to recomp', () => {
    const history = [record(200), record(100, 'fatLoss'), ...onRecompFor(56)];
    expect(review({ history, days: 56 })?.week).toBe(8);
  });

  it('it looks at twelve weeks at most', () => {
    expect(review({ days: 84 })?.periodDays).toBe(84);
    expect(review({ days: 60 })?.periodDays).toBe(60);
    expect(review({ days: 140 })?.periodDays).toBe(84);
  });
});

describe('the verdict', () => {
  it('waist down and two lifts up: working, with the three facts', () => {
    const r = review();
    expect(r?.verdict).toBe('working');
    expect(r?.missing).toEqual([]);
    expect(r?.waist).toBe('down');
    expectClose(r?.waistChangeCm, -2.625, 1e-9);
    expect(r?.strength).toBe('up');
    expect(r?.liftsUp).toEqual(['Back squat', 'Barbell row']);
    expectClose(r?.weightChangeFraction, -0.4 / 82, 1e-9);
    expect(r?.nextGoal).toBeUndefined();
  });

  it('waist down and strength held is working too', () => {
    expect(review({ strength: lifts(1) })?.verdict).toBe('working');
  });

  it('weight down 3% with strength held: a slow cut', () => {
    const r = review({ trendPoints: trend(82, 79.5), strength: lifts(0) });
    expect(r?.verdict).toBe('slowCut');
    expect(r?.nextGoal).toBe('fatLoss');
  });

  it('a slow cut suggests no deficit to someone not allowed one', () => {
    const r = review({
      trendPoints: trend(82, 79.5),
      recommendation: { mode: 'maintenance', reason: 'deficitNotAllowed' },
    });
    expect(r?.verdict).toBe('slowCut');
    expect(r?.nextGoal).toBeUndefined();
  });

  it('no clear change in waist, strength up: probably working', () => {
    const r = review({ waist: waistOver(92, 91.5) });
    expect(r?.waist).toBe('noClearChange');
    expect(r?.verdict).toBe('probablyWorking');
  });

  it('nothing moved at twelve weeks: not working, with a next goal', () => {
    const r = review({
      trendPoints: trend(82, 82),
      waist: waistOver(92, 91.5),
      strength: lifts(0),
      recommendation: cutFirst,
    });
    expect(r?.verdict).toBe('notWorking');
    expect(r?.nextGoal).toBe('fatLoss');
  });

  it('not working, where recomp is still what fits: no other goal', () => {
    const r = review({ trendPoints: trend(82, 82), waist: waistOver(92, 91.5), strength: lifts(0) });
    expect(r?.verdict).toBe('notWorking');
    expect(r?.nextGoal).toBeUndefined();
  });

  it('the same at eight weeks is too early to tell', () => {
    const r = review({
      days: 56,
      trendPoints: trend(82, 82, 56),
      waist: waistOver(92, 91.5, 56),
      strength: lifts(0, 56),
    });
    expect(r?.verdict).toBe('tooEarly');
    expect(r?.nextGoal).toBeUndefined();
  });

  it('unless lean and trained, where it is said at eight weeks', () => {
    const r = review({
      days: 56,
      trendPoints: trend(82, 82, 56),
      waist: waistOver(92, 91.5, 56),
      strength: lifts(0, 56),
      recommendation: lean,
    });
    expect(r?.verdict).toBe('notWorking');
    expect(r?.nextGoal).toBe('leanGain');
  });

  it('a waist that went up, or strength that fell, is not working', () => {
    expect(review({ waist: waistOver(90, 93) })?.verdict).toBe('notWorking');
    const fell = review({ strength: lifts(-6) });
    expect(fell?.strength).toBe('down');
    expect(fell?.liftsDown).toHaveLength(2);
    expect(fell?.verdict).toBe('notWorking');
  });
});

describe('without enough logged there is no verdict', () => {
  it('two waist measurements', () => {
    const r = review({
      waist: [
        new WaistObservation({ date: today.addDays(-84), waistCm: 92 }),
        new WaistObservation({ date: today, waistCm: 89 }),
      ],
    });
    expect(r).toBeDefined();
    expect(r?.verdict).toBeUndefined();
    expect(r?.missing).toEqual(['waist']);
    expect(r?.waistMeasurements).toBe(2);
  });

  it('no waist measurement lately', () => {
    const r = review({
      waist: [84, 77, 70, 63].map((d) => new WaistObservation({ date: today.addDays(-d), waistCm: 92 })),
    });
    expect(r?.missing).toEqual(['waist']);
  });

  it('one lift, or lifts trained in too few weeks', () => {
    expect(review({ strength: [lift('Back squat', 100, 106)] })?.missing).toEqual(['strength']);
    expect(
      review({
        strength: [
          lift('Back squat', 100, 106, { everyDays: 21 }),
          lift('Barbell row', 60, 63, { everyDays: 21 }),
        ],
      })?.missing,
    ).toEqual(['strength']);
    expect(review({ strength: [] })?.missing).toEqual(['strength']);
  });

  it('lifts not trained in the last two weeks', () => {
    expect(
      review({
        strength: [
          lift('Back squat', 100, 106, { lastDaysAgo: 21 }),
          lift('Barbell row', 60, 63, { lastDaysAgo: 21 }),
        ],
      })?.missing,
    ).toEqual(['strength']);
  });

  it('no weight trend that far back', () => {
    const r = review({ trendPoints: trend(82, 82).slice(100) });
    expect(r?.missing).toEqual(['weight']);
  });

  it('everything missing is listed', () => {
    const r = review({ trendPoints: [], waist: [], strength: [] });
    expect(r).toBeDefined();
    expect(r?.missing).toEqual([...RecompMeasure.values]);
    expect(r?.verdict).toBeUndefined();
  });
});
