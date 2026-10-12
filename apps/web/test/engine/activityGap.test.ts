import { describe, expect, it } from 'vitest';
import {
  CalendarDate,
  DailyActivity,
  IntakeDay,
  Profile,
  ScreeningAnswers,
  UserSetup,
  type WeightObservation,
} from '../../src/domain';
import {
  ActivityGap,
  activityGaps,
  analyze,
  type CoachSnapshot,
  consecutiveDeficitWeeks,
  DailyTargets,
  gapPrior,
  openGap,
  TargetsRecord,
  type TdeeStatus,
  WeightTrendPoint,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-147: what a gap is, and what it means for the coach. */
const start = CalendarDate.of(2026, 1, 1);

const weigh = (day: number, kg = 85): WeightObservation => ({ date: start.addDays(day), weightKg: kg });

const ate = (day: number, kcal = 2000) =>
  new IntakeDay({ date: start.addDays(day), kcal, proteinG: 120, carbsG: 200, fatG: 70 });

const record = (
  day: number,
  {
    rate = -0.005,
    status = 'updated',
    tdee = 2700,
    sigma = 150,
  }: { rate?: number; status?: TdeeStatus; tdee?: number; sigma?: number } = {},
) =>
  new TargetsRecord({
    effectiveFrom: start.addDays(day),
    targets: new DailyTargets({ kcal: 2200, proteinG: 160, fatG: 70, carbsG: 220, weeklyRateFraction: rate }),
    mode: 'fatLoss',
    tdeeKcal: tdee,
    tdeeSigmaKcal: sigma,
    tdeeStatus: status,
  });

describe('a gap', () => {
  it('is 7 or more days with no weigh-in and no food', () => {
    const gaps = activityGaps({ weights: [weigh(0), weigh(8)], intake: [], today: start.addDays(8) });
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.from).toBe(start.addDays(1));
    expect(gaps[0]?.to).toBe(start.addDays(7));
    expect(gaps[0]?.days).toBe(7);
  });

  it('six empty days is not one', () => {
    expect(activityGaps({ weights: [weigh(0), weigh(7)], intake: [], today: start.addDays(7) })).toEqual([]);
  });

  it('food logged inside it means there was no gap', () => {
    expect(
      activityGaps({ weights: [weigh(0), weigh(20)], intake: [ate(6), ate(13)], today: start.addDays(20) }),
    ).toEqual([]);
  });

  it('an empty food day is not activity', () => {
    expect(
      activityGaps({ weights: [weigh(0), weigh(20)], intake: [ate(10, 0)], today: start.addDays(20) }),
    ).toHaveLength(1);
  });

  it('is open on the day of return until something is recorded', () => {
    const today = start.addDays(22);
    const open = openGap({ weights: [weigh(0)], intake: [], today });
    expect(open?.days).toBe(21);
    expect(open?.returnOn).toBe(today);
    expect(
      openGap({ weights: [weigh(0), weigh(22)], intake: [], today }),
      'the weigh-in closes it',
    ).toBeUndefined();
  });

  it('nothing ever recorded is not a gap', () => {
    expect(openGap({ weights: [], intake: [], today: start })).toBeUndefined();
  });
});

describe('the deficit count', () => {
  it('restarts after a gap of two weeks or more', () => {
    const today = start.addDays(7 * 11 + 16 + 3);
    const history = [record(0)];
    expect(consecutiveDeficitWeeks(history, today)).toBe(13);
    expect(consecutiveDeficitWeeks(history, today, { restartOn: today.addDays(-3) })).toBe(0);
  });

  it('a restart before the deficit began changes nothing', () => {
    const history = [record(0, { rate: 0 }), record(30)];
    const today = start.addDays(58);
    expect(consecutiveDeficitWeeks(history, today, { restartOn: start.addDays(10) })).toBe(4);
  });
});

describe('the starting estimate after a gap', () => {
  const trend = (levels: readonly (readonly [day: number, levelKg: number])[]) =>
    levels.map(
      ([day, levelKg]) =>
        new WeightTrendPoint({
          date: start.addDays(day),
          levelKg,
          slopeKgPerDay: 0,
          waterKg: 0,
          levelVariance: 0.1,
          slopeVariance: 0.001,
          observed: true,
          rejected: false,
        }),
    );

  const resting = (kg: number) => 10 * kg + 800;

  const prior = ({
    gapDays,
    weightAfter = 85,
    history,
  }: {
    gapDays: number;
    weightAfter?: number;
    history?: TargetsRecord[];
  }) => {
    const gap = new ActivityGap({ from: start.addDays(40), to: start.addDays(39 + gapDays) });
    const asOf = gap.to.addDays(3);
    return gapPrior({
      gaps: [gap],
      history: history ?? [record(20)],
      trend: trend([
        [39, 85],
        [40 + gapDays + 2, weightAfter],
      ]),
      asOf,
      windowDays: 28,
      profileRevision: 0,
      restingEnergyAt: resting,
    });
  };

  it('a three-week gap keeps the usual prior', () => {
    expect(prior({ gapDays: 21 })).toBeUndefined();
  });

  it('a two-month gap starts from the last measurement, widened', () => {
    const p = prior({ gapDays: 60 });
    expect(p?.kcal).toBe(2700);
    expectClose(p?.sigmaKcal, 270, 1e-9);
  });

  it('an already wide uncertainty is not narrowed', () => {
    const p = prior({ gapDays: 60, history: [record(20, { sigma: 400 })] });
    expect(p?.sigmaKcal).toBe(400);
  });

  it('weight up 6% rescales it by the change in resting energy', () => {
    const p = prior({ gapDays: 40, weightAfter: 85 * 1.06 });
    expectClose(p?.kcal, 2700 + 10 * 85 * 0.06, 1e-6);
  });

  it('a big weight change rescales after a short gap too', () => {
    expect(prior({ gapDays: 10, weightAfter: 85 * 0.93 })).toBeDefined();
  });

  it('with no measured expenditure before the gap there is none', () => {
    expect(prior({ gapDays: 60, history: [record(20, { status: 'held' })] })).toBeUndefined();
  });

  it('a gap that ended before the window is forgotten', () => {
    const gap = new ActivityGap({ from: start.addDays(40), to: start.addDays(99) });
    expect(
      gapPrior({
        gaps: [gap],
        history: [record(20)],
        trend: trend([
          [39, 85],
          [140, 85],
        ]),
        asOf: start.addDays(140),
        windowDays: 28,
        profileRevision: 0,
        restingEnergyAt: resting,
      }),
    ).toBeUndefined();
  });
});

it('analysis reports the break from the deficit', () => {
  const setup = new UserSetup({
    profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(1990, 1, 1), heightCm: 180 }),
    screening: new ScreeningAnswers(),
    trainingStatus: 'intermediate',
    trainingDaysPerWeek: 3,
    dailyActivity: DailyActivity.values[0],
    goalMode: 'fatLoss',
    onboardedOn: start,
    unitSystem: 'metric',
  });
  const today = start.addDays(40);
  const snapshot = analyze({
    setup,
    weights: [...upTo(20).map((i) => weigh(i)), weigh(40)],
    intake: upTo(20).map((i) => ate(i)),
    today,
  }) as CoachSnapshot;
  expect(snapshot.gaps).toHaveLength(1);
  expect(snapshot.gaps[0]?.days).toBe(20);
  expect(snapshot.deficitRestartOn).toBe(today);
});
