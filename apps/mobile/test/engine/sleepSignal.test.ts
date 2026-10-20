import { describe, expect, it } from 'vitest';
import { CalendarDate, SleepNight } from '../../src/domain';
import {
  BodyFatEstimate,
  CoachConfidence,
  computeTargets,
  computeTargetsTraced,
  DailyTargets,
  explainTargets,
  findInsights,
  InsightRule,
  shortSleep,
  type SleepAverage,
  sleepAverageOf,
  SleepRule,
  TargetInputs,
  TargetsExplanation,
  TargetsRecord,
  TdeeEstimate,
} from '../../src/engine';
import { CoachingPolicy, Profile, ScreeningAnswers } from '../../src/domain';
import { expectClose } from '../support/expectClose';

/** MM-252: the fourteen-night average, and short sleep as a signal the coach names. */
const today = CalendarDate.of(2026, 10, 20);

const typed = (daysAgo: number, minutes: number) => new SleepNight({ date: today.addDays(-daysAgo), minutesAsleep: minutes, source: 'typed' });

describe('sleepAverageOf', () => {
  it('averages the nights that ended in the window, and counts them', () => {
    const nights = [typed(0, 420), typed(1, 360), typed(13, 480), typed(14, 100), typed(-1, 100)];
    const average = sleepAverageOf({ nights, through: today });
    expect(average?.nights).toBe(3);
    expectClose(average?.averageMinutes ?? 0, 420, 1e-9);
    expect(average?.from).toBe(today.addDays(-13));
    expect(average?.to).toBe(today);
  });

  it('is undefined with no night in the window', () => {
    expect(sleepAverageOf({ nights: [], through: today })).toBeUndefined();
    expect(sleepAverageOf({ nights: [typed(20, 400)], through: today })).toBeUndefined();
  });
});

describe('shortSleep', () => {
  const average = (averageMinutes: number, nights: number): SleepAverage => ({ averageMinutes, nights, from: today.addDays(-13), to: today });

  it('is under six hours over at least seven recorded nights', () => {
    expect(shortSleep(average(359, 7))).toBe(true);
    expect(shortSleep(average(360, 14))).toBe(false);
    expect(shortSleep(average(300, 6))).toBe(false);
    expect(shortSleep(undefined)).toBe(false);
    expect(SleepRule.shortSleepHours).toBe(6);
    expect(SleepRule.windowNights).toBe(14);
  });
});

describe('the explanation of a check-in', () => {
  const profile = new Profile({ sex: 'male', birthDate: CalendarDate.of(1994, 3, 1), heightCm: 180 });
  const policy = CoachingPolicy.derive({ profile, screening: new ScreeningAnswers(), today });
  const inputs = (tdee: number, previous?: DailyTargets) =>
    new TargetInputs({
      sex: 'male',
      heightCm: 180,
      trendWeightKg: 90,
      bodyFat: new BodyFatEstimate({ percent: 25, sigmaPercent: 5 }),
      mode: 'fatLoss',
      trainingStatus: 'intermediate',
      policy,
      tdeeKcal: tdee,
      bmrKcal: 1900,
      previous,
    });
  const estimate = (kcal: number) =>
    new TdeeEstimate({ kcal, sigmaKcal: 250, status: 'updated', usableIntakeDays: 12, excludedPartialDays: 2, weighIns: 11 });

  const explain = (sleepAverage: SleepAverage | undefined) => {
    const before = computeTargets(inputs(2950));
    const traced = computeTargetsTraced(inputs(2650, before));
    return explainTargets({
      trigger: 'checkIn',
      previous: new TargetsRecord({ effectiveFrom: today.addDays(-7), mode: 'fatLoss', tdeeKcal: 2950, tdeeSigmaKcal: 250, tdeeStatus: 'updated', targets: before }),
      targets: traced.targets,
      trace: traced.trace,
      tdee: estimate(2650),
      sleepAverage,
    });
  };

  it('names short sleep beside the lines, never as a line, and keeps it through storage', () => {
    const e = explain({ averageMinutes: 330, nights: 12, from: today.addDays(-13), to: today });
    expect(e.shortSleepAverageMinutes).toBe(330);
    expect(e.shortSleepNights).toBe(12);
    expect(e.lines.map((l) => l.reason)).not.toContain('shortSleep');
    const again = TargetsExplanation.decode(e.encode());
    expect(again.shortSleepAverageMinutes).toBe(330);
    expect(again.shortSleepNights).toBe(12);
    expectClose(again.linesTotal, e.linesTotal, 1e-9);
  });

  it('says nothing of sleep that was not short, or not recorded', () => {
    expect(explain({ averageMinutes: 430, nights: 12, from: today.addDays(-13), to: today }).shortSleepAverageMinutes).toBeUndefined();
    expect(explain(undefined).shortSleepAverageMinutes).toBeUndefined();
    expect(TargetsExplanation.decode(explain(undefined).encode()).shortSleepNights).toBe(0);
  });
});

describe('the insight', () => {
  const through = today.addDays(-1);
  const find = (sleepAverage: SleepAverage | undefined) =>
    findInsights({ through, intake: [], weights: [], history: [], sleepAverage });

  it('short sleep over the fortnight is an insight with its average and nights, in the coaching tier', () => {
    const [insight] = find({ averageMinutes: 340, nights: 10, from: through.addDays(-13), to: through });
    expect(insight?.rule).toBe('shortSleep');
    expect(insight?.figures).toEqual({ averageMinutes: 340, nights: 10 });
    expect(insight?.basisDays).toBe(14);
    expect(InsightRule.priority('shortSleep')).toBe('coaching');
    expect(InsightRule.aboutWeight('shortSleep')).toBe(false);
  });

  it('there is none when sleep was not short, and none for a person with an eating-disorder history either way', () => {
    expect(find({ averageMinutes: 400, nights: 10, from: through.addDays(-13), to: through })).toEqual([]);
    expect(find(undefined)).toEqual([]);
    // Sleep is neither about weight nor about intake, so the limit leaves it alone.
    const limited = findInsights({
      through,
      intake: [],
      weights: [],
      history: [],
      sleepAverage: { averageMinutes: 340, nights: 10, from: through.addDays(-13), to: through },
      limitToProteinAndLogging: true,
    });
    expect(limited.map((i) => i.rule)).toEqual(['shortSleep']);
  });
});
