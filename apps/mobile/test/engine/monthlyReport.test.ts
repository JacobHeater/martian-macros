import { describe, expect, it } from 'vitest';
import {
  builtInExercises,
  CalendarDate,
  type Exercise,
  type GoalMode,
  IntakeDay,
  WaistObservation,
  type WeightObservation,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../../src/domain';
import {
  buildMonthlyReport,
  DailyTargets,
  estimatedOneRepMax,
  ExplanationLine,
  type ExplanationReason,
  type ModeRecommendation,
  type MonthlyReport,
  ReportPeriod,
  reportPeriods,
  TargetsExplanation,
  TargetsRecord,
  type TdeeStatus,
  WeightTrendPoint,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-33: a monthly report, honest about thin data. */
const start = CalendarDate.of(2026, 1, 1);
const month = new ReportPeriod({ index: 0, from: start });

const ate = (day: number, { protein = 150, kcal = 2100 }: { protein?: number; kcal?: number } = {}) =>
  new IntakeDay({
    date: start.addDays(day),
    kcal,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness: 'complete',
  });

const weighed = (day: number, kg: number): WeightObservation => ({ date: start.addDays(day), weightKg: kg });

const point = (day: number, kg: number) =>
  new WeightTrendPoint({
    date: start.addDays(day),
    levelKg: kg,
    slopeKgPerDay: 0,
    waterKg: 0,
    levelVariance: 0.1,
    slopeVariance: 0.001,
    observed: true,
    rejected: false,
  });

const record = (
  day: number,
  {
    kcal = 2100,
    tdee = 2700,
    status = 'updated',
    previous = 2200,
    reason = 'expenditureEstimate',
  }: { kcal?: number; tdee?: number; status?: TdeeStatus; previous?: number; reason?: ExplanationReason } = {},
) =>
  new TargetsRecord({
    effectiveFrom: start.addDays(day),
    mode: 'fatLoss',
    tdeeKcal: tdee,
    tdeeSigmaKcal: 180,
    tdeeStatus: status,
    targets: new DailyTargets({ kcal, proteinG: 160, fatG: 70, carbsG: 200, weeklyRateFraction: -0.0075 }),
    explanation: new TargetsExplanation({
      lines: [new ExplanationLine(reason, kcal - previous)],
      previousKcal: previous,
      newKcal: kcal,
      estimateStatus: status,
    }),
  });

const everyDay = () => upTo(28).map((d) => ate(d));
const everyOtherDay = () => upTo(14).map((i) => weighed(i * 2, 90));

const report = ({
  intake,
  weights,
  waist = [],
  history,
  trend,
}: {
  intake?: IntakeDay[];
  weights?: WeightObservation[];
  waist?: WaistObservation[];
  history?: TargetsRecord[];
  trend?: WeightTrendPoint[];
} = {}) =>
  buildMonthlyReport({
    period: month,
    intake: intake ?? everyDay(),
    weights: weights ?? everyOtherDay(),
    waist,
    history: history ?? [record(14)],
    trend: trend ?? upTo(28).map((d) => point(d, 90 - d * 0.04)),
  });

describe('which reports exist', () => {
  it('the first is ready the day after day 28', () => {
    expect(reportPeriods({ onboardedOn: start, today: start.addDays(27) })).toEqual([]);
    const ready = reportPeriods({ onboardedOn: start, today: start.addDays(28) });
    expect(ready).toHaveLength(1);
    expect(ready[0]?.from).toBe(start);
    expect(ready[0]?.to).toBe(start.addDays(27));
  });

  it('then one every 28 days, oldest first', () => {
    const ready = reportPeriods({ onboardedOn: start, today: start.addDays(83) });
    expect(ready.map((p) => p.index)).toEqual([0, 1]);
    expect(ready[ready.length - 1]?.from).toBe(start.addDays(28));
  });
});

describe('what the month holds', () => {
  it('days logged, whole days and weigh-ins', () => {
    const r = report({
      intake: [
        ...upTo(20).map((d) => ate(d)),
        ...upTo(4).map(
          (i) =>
            new IntakeDay({
              date: start.addDays(20 + i),
              kcal: 400,
              proteinG: 20,
              carbsG: 40,
              fatG: 10,
              completeness: 'partial',
            }),
        ),
      ],
    });
    expect(r.daysLogged).toBe(24);
    expect(r.completeDays).toBe(20);
    expect(r.weighIns).toBe(14);
  });

  it('days outside the month are not counted', () => {
    const r = report({
      intake: [ate(-3), ...everyDay(), ate(30)],
      weights: [weighed(-2, 91), weighed(0, 90), weighed(40, 85)],
    });
    expect(r.daysLogged).toBe(28);
    expect(r.weighIns).toBe(1);
  });

  it('trend change against the intended pace', () => {
    const r = report();
    expectClose(r.trendChangeKg, -27 * 0.04, 1e-9);
    // -0.75% a week of about 88.9 kg for four weeks.
    expectClose(r.intendedChangeKg, -0.0075 * (90 - 27 * 0.04) * 4, 1e-6);
  });

  it('too few weigh-ins cannot say how the trend moved', () => {
    const r = report({ weights: [weighed(0, 90), weighed(10, 89)] });
    expect(r.trendChangeKg).toBeUndefined();
  });

  it('average protein against the target', () => {
    const r = report({
      intake: [
        ...upTo(14).map((d) => ate(d, { protein: 120 })),
        ...upTo(14).map((d) => ate(d + 14, { protein: 160 })),
      ],
    });
    expectClose(r.averageProteinG, 140, 1e-9);
    expect(r.averageProteinTargetG).toBe(160);
  });

  // MM-155: the waist by the one rule every feature uses, not the month's first and last reading.
  it('waist change needs a measurement at both ends of the month', () => {
    expect(report({ waist: [new WaistObservation({ date: start.addDays(3), waistCm: 100 })] }).waistChange).toBeUndefined();
    const r = report({
      waist: [
        new WaistObservation({ date: start.addDays(2), waistCm: 100 }),
        new WaistObservation({ date: start.addDays(26), waistCm: 97.5 }),
      ],
    });
    expect(r.waistChange?.direction).toBe('down');
    expect(r.waistChange?.fromCm).toBe(100);
    expect(r.waistChange?.toCm).toBe(97.5);
  });

  it('a waist difference inside the tape’s noise is no clear change, and the ends are smoothed', () => {
    const r = report({
      waist: [
        new WaistObservation({ date: start.addDays(-5), waistCm: 93 }),
        new WaistObservation({ date: start.addDays(2), waistCm: 92 }),
        new WaistObservation({ date: start.addDays(9), waistCm: 92.5 }),
        new WaistObservation({ date: start.addDays(16), waistCm: 91.5 }),
        new WaistObservation({ date: start.addDays(23), waistCm: 92 }),
        new WaistObservation({ date: start.addDays(27), waistCm: 91 }),
      ],
    });
    expect(r.waistChange?.direction).toBe('noClearChange');
    expect(r.waistChange?.fromCm).toBe(92.5);
    expect(r.waistChange?.toCm).toBe(91.5);
    expectClose(r.waistChange?.thresholdCm, 1.4, 1e-9);
  });
});

describe('the expenditure estimate', () => {
  it('is shown with its uncertainty when the month supports it', () => {
    const r = report();
    expect(r.estimate?.kcal).toBe(2700);
    expect(r.estimate?.sigmaKcal).toBe(180);
    expect(r.estimateGap).toBeUndefined();
  });

  it('six logged days: says it could not be measured, and why', () => {
    const r = report({ intake: upTo(6).map((d) => ate(d)) });
    expect(r.estimate).toBeUndefined();
    expect(r.estimateGap).toBe('tooFewFoodDays');
  });

  it('enough food but never settled', () => {
    const r = report({ history: [record(14, { status: 'held' })] });
    expect(r.estimate).toBeUndefined();
    expect(r.estimateGap).toBe('notSettled');
  });

  it('uses the latest settled estimate of the month', () => {
    const r = report({ history: [record(7, { tdee: 2600 }), record(21, { tdee: 2750 })] });
    expect(r.estimate?.kcal).toBe(2750);
  });
});

describe('changes to the targets', () => {
  it('both are listed, each with the estimate it rested on', () => {
    const r = report({
      history: [
        record(7, { kcal: 2150, previous: 2200, tdee: 2650, reason: 'paceAndWeight' }),
        record(21, { kcal: 2050, previous: 2150, tdee: 2600 }),
      ],
    });
    expect(r.targetChanges).toHaveLength(2);
    const [first, last] = r.targetChanges;
    expect(first?.previousKcal).toBe(2200);
    expect(first?.newKcal).toBe(2150);
    expect(first?.tdeeKcal).toBe(2650);
    expect(last?.tdeeKcal).toBe(2600);
    expect(first?.lines).toHaveLength(1);
    expect(first?.lines[0]?.reason).toBe('paceAndWeight');
  });

  it('changes outside the month are not in it', () => {
    const r = report({ history: [record(-10), record(14), record(40)] });
    expect(r.targetChanges).toHaveLength(1);
  });

  it('a month with no change lists none', () => {
    expect(report({ history: [] }).targetChanges).toEqual([]);
  });
});

describe('strength', () => {
  const byId = (id: string): Exercise => {
    const found = builtInExercises.find((e) => e.id === id);
    if (found === undefined) throw new Error(`The library has no ${id}.`);
    return found;
  };
  const squat = byId('back-squat');
  const row = byId('barbell-row');
  let nextId = 1;

  /**
   * A finished workout on `day` of the month: [exercise id, load] pairs,
   * each for one set of six.
   */
  function trained(day: number, loads: readonly (readonly [string, number])[], done = true): Workout {
    const date = start.addDays(day);
    const began = new Date(date.year, date.month - 1, date.day, 18);
    return new Workout({
      id: nextId++,
      date,
      startedAt: began,
      endedAt: done ? new Date(began.getTime() + 50 * 60 * 1000) : undefined,
      exercises: loads.map(
        ([exerciseId, loadKg]) =>
          new WorkoutExercise({ exerciseId, sets: [new WorkoutSet({ reps: 6, loadKg })] }),
      ),
    });
  }

  const withWorkouts = (workouts: Workout[]) =>
    buildMonthlyReport({
      period: month,
      intake: everyDay(),
      weights: everyOtherDay(),
      waist: [],
      history: [record(14)],
      trend: upTo(28).map((d) => point(d, 90)),
      workouts,
      exercises: [squat, row],
    });

  it('a month with no training has no workouts and no lifts', () => {
    const r = report();
    expect(r.workouts).toBe(0);
    expect(r.lifts).toEqual([]);
  });

  it('each lift goes from its first to its last session of the month', () => {
    const r = withWorkouts([
      trained(1, [
        [squat.id, 100],
        [row.id, 60],
      ]),
      trained(8, [
        [squat.id, 102.5],
        [row.id, 60],
      ]),
      trained(15, [[squat.id, 105]]),
      trained(22, [[squat.id, 107.5]]),
    ]);
    expect(r.workouts).toBe(4);
    expect(r.lifts.map((l) => l.name)).toEqual([squat.name, row.name]);
    const [first, last] = r.lifts;
    expect(first?.sessions).toBe(4);
    expect(first?.toKg).toBeGreaterThan(first?.fromKg as number);
    // The first session of the month stands for itself: nothing before
    // it to smooth with.
    expectClose(
      first?.fromKg,
      estimatedOneRepMax(new WorkoutSet({ reps: 6, loadKg: 100 }), { load: squat.load }) as number,
      1e-9,
    );
    expectClose(last?.toKg, last?.fromKg as number, 1e-9);
  });

  it('a lift done once in the month is not listed: one session shows no change', () => {
    const r = withWorkouts([
      trained(1, [
        [squat.id, 100],
        [row.id, 60],
      ]),
      trained(8, [[squat.id, 102.5]]),
    ]);
    expect(r.lifts.map((l) => l.name)).toEqual([squat.name]);
  });

  it('sessions outside the month, and unfinished ones, do not count', () => {
    const r = withWorkouts([
      trained(-7, [[squat.id, 95]]),
      trained(1, [[squat.id, 100]]),
      trained(20, [[squat.id, 110]], false),
      trained(35, [[squat.id, 120]]),
    ]);
    expect(r.workouts).toBe(1);
    expect(r.lifts).toEqual([]);
  });

  it('a later session does not change what an old report says', () => {
    const inMonth = [trained(1, [[squat.id, 100]]), trained(22, [[squat.id, 105]])];
    const then = withWorkouts(inMonth).lifts;
    const later = withWorkouts([...inMonth, trained(40, [[squat.id, 130]])]).lifts;
    expect(then).toHaveLength(1);
    expect(later).toHaveLength(1);
    expect(later[0]?.fromKg).toBe(then[0]?.fromKg);
    expect(later[0]?.toKg).toBe(then[0]?.toKg);
  });
});

describe('the recomp review', () => {
  const eligible: ModeRecommendation = { mode: 'recomp', reason: 'recompEligible' };

  const onRecomp = (day: number, mode: GoalMode = 'recomp') =>
    new TargetsRecord({
      effectiveFrom: start.addDays(day),
      mode,
      tdeeKcal: 2500,
      tdeeSigmaKcal: 150,
      tdeeStatus: 'updated',
      targets: new DailyTargets({ kcal: 2400, proteinG: 160, fatG: 70, carbsG: 250, weeklyRateFraction: -0.001 }),
    });

  /**
   * The report of the month that begins `monthStart` days after recomp
   * began on day 0, with waist measured weekly throughout.
   */
  const reportFrom = (
    monthStart: number,
    options: { recommendation?: ModeRecommendation | undefined; mode?: GoalMode } = {},
  ): MonthlyReport => {
    // A default would also replace a recommendation given as undefined,
    // which is the case one test is about.
    const recommendation = 'recommendation' in options ? options.recommendation : eligible;
    const mode = options.mode ?? 'recomp';
    return buildMonthlyReport({
      period: new ReportPeriod({ index: 0, from: start.addDays(monthStart) }),
      intake: [],
      weights: [],
      waist: upTo(21).map((i) => new WaistObservation({ date: start.addDays(i * 7), waistCm: 92 - i * 7 * 0.04 })),
      history: [onRecomp(0, mode)],
      trend: upTo(141).map((d) => point(d, 82)),
      recommendation,
    });
  };

  it('a month in which none falls due has none', () => {
    expect(reportFrom(0).recompReview).toBeUndefined();
    expect(reportFrom(100).recompReview).toBeUndefined();
  });

  it('the week 8 review is in the month it fell due in', () => {
    // Days 42 to 69: the review is due on day 56.
    const review = reportFrom(42).recompReview;
    expect(review?.week).toBe(8);
    // Read on the last day it was shown in the month, day 69.
    expect(review?.periodDays).toBe(69);
    expect(review?.waist).toBe('down');
    expect(review?.missing).toEqual(['strength']);
  });

  it('a review due in the month before is not repeated, and the next one due is shown', () => {
    // Days 60 to 87: week 8 was already showing; week 12 is due on day 84.
    expect(reportFrom(60).recompReview?.week).toBe(12);
    // Days 57 to 84: week 8 fell due on day 56, the day before.
    expect(reportFrom(57).recompReview?.week).toBe(12);
    // Days 56 to 83: week 8 falls due on the first day and week 12 the
    // day after the last.
    expect(reportFrom(56).recompReview?.week).toBe(8);
  });

  it('there is none on another goal, or when no recommendation is given', () => {
    expect(reportFrom(42, { mode: 'fatLoss' }).recompReview).toBeUndefined();
    expect(reportFrom(42, { recommendation: undefined }).recompReview).toBeUndefined();
  });
});
