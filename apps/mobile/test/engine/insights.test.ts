import { describe, expect, it } from 'vitest';
import { CalendarDate, type DayCompleteness, type GoalMode, IntakeDay, WaistObservation, type WeightObservation } from '../../src/domain';
import {
  DailyTargets,
  findInsights,
  Insight,
  type InsightLogEntry,
  type InsightRule,
  selectInsight,
  StallAssessment,
  TargetsRecord,
  WeightTrendPoint,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-141: insights from a fixed catalog of rules, rationed. */
const through = CalendarDate.of(2026, 3, 14);
const today = through.addDays(1);

const targets = (proteinMinimumG = 130, mode: GoalMode = 'fatLoss') =>
  new TargetsRecord({
    effectiveFrom: through.addDays(-60),
    mode,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targets: new DailyTargets({
      kcal: 2100,
      proteinG: 160,
      proteinMinimumG,
      fatG: 70,
      carbsG: 220,
      weeklyRateFraction: -0.005,
    }),
  });

const day = (
  daysAgo: number,
  {
    kcal = 2100,
    protein = 150,
    mark = 'complete',
    estimatedShare = 0,
    palmProteinShare = 0,
  }: { kcal?: number; protein?: number; mark?: DayCompleteness; estimatedShare?: number; palmProteinShare?: number } = {},
) =>
  new IntakeDay({
    date: through.addDays(-daysAgo),
    kcal,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness: mark,
    estimatedShare,
    palmProteinShare,
  });

/** Days `from` up to but not including `to`, each made with `changes`. */
const days = (from: number, to: number, changes: Parameters<typeof day>[1] = {}) =>
  upTo(to - from).map((i) => day(from + i, changes));

const weighed = (count: number): WeightObservation[] => [
  ...upTo(count).map((i) => ({ date: through.addDays(-i), weightKg: 85 })),
  { date: through.addDays(-40), weightKg: 86 },
];

/** A flat trend over the fortnight, each point `sigmaKg` uncertain, moving `changeKg` in all. */
const trend = (changeKg = 0, sigmaKg = 0.2): WeightTrendPoint[] =>
  upTo(14).map(
    (i) =>
      new WeightTrendPoint({
        date: through.addDays(-13 + i),
        levelKg: 85 + (changeKg * i) / 13,
        slopeKgPerDay: changeKg / 13,
        waterKg: 0,
        levelVariance: sigmaKg * sigmaKg,
        slopeVariance: 0,
        observed: true,
        rejected: false,
      }),
  );

const waistOn = (entries: readonly (readonly [daysAgo: number, cm: number])[]) =>
  entries.map(([daysAgo, cm]) => new WaistObservation({ date: through.addDays(-daysAgo), waistCm: cm }));

/** Six weeks of tape, two centimetres down over the last fortnight once smoothed. */
const tapeDown: readonly (readonly [number, number])[] = [
  [40, 93.0],
  [27, 92.6],
  [20, 92.2],
  [13, 91.0],
  [6, 90.4],
  [1, 90.0],
];

const find = ({
  intake,
  weighIns = 14,
  stall,
  limited = false,
  history = [targets()],
  trend: points = [],
  waist = [],
}: {
  intake?: IntakeDay[];
  weighIns?: number;
  stall?: StallAssessment;
  limited?: boolean;
  history?: TargetsRecord[];
  trend?: WeightTrendPoint[];
  waist?: WaistObservation[];
} = {}) =>
  findInsights({
    through,
    intake: intake ?? days(0, 14),
    weights: weighed(weighIns),
    history,
    stall,
    trend: points,
    waist,
    limitToProteinAndLogging: limited,
  });

const stalled = new StallAssessment({ status: 'stalled', windowDays: 21, diagnosis: 'estimate' });

/** The one insight found; the test fails when there is not exactly one. */
function only(insights: readonly Insight[]): Insight {
  expect(insights).toHaveLength(1);
  return insights[0] as Insight;
}

describe('the catalog', () => {
  it('a steady, well-logged fortnight produces nothing', () => {
    expect(find()).toEqual([]);
  });

  it('protein short states the days and the average shortfall', () => {
    const i = only(find({ intake: [...days(0, 5), ...days(5, 14, { protein: 102 })] }));
    expect(i.rule).toBe('proteinShort');
    expect(i.figures['wholeDays']).toBe(14);
    expect(i.figures['metDays']).toBe(5);
    expectClose(i.figures['averageShortfallG'], 28, 1e-9);
    expect(i.basisDays).toBe(14);
  });

  it('protein met on half the days or more says nothing', () => {
    expect(find({ intake: [...days(0, 7), ...days(7, 14, { protein: 100 })] })).toEqual([]);
  });

  it('more than a third of logged days partial', () => {
    const i = only(find({ intake: [...days(0, 8), ...days(8, 13, { kcal: 700, mark: 'partial' })] }));
    expect(i.rule).toBe('partialDays');
    expect(i.figures['loggedDays']).toBe(13);
    expect(i.figures['partialDays']).toBe(5);
  });

  it('estimates above half of calories', () => {
    const i = only(find({ intake: days(0, 14, { estimatedShare: 0.6 }) }));
    expect(i.rule).toBe('estimatesRising');
    expectClose(i.figures['estimatedShare'], 0.6, 1e-9);
  });

  // MM-46: a hand-portion logger is nudged to weigh their main protein for a week.
  it('protein mostly by palm, in fat loss, asks to weigh it', () => {
    const i = only(find({ intake: days(0, 14, { palmProteinShare: 0.8 }) }));
    expect(i.rule).toBe('weighProtein');
    expect(i.figures['wholeDays']).toBe(14);
    expectClose(i.figures['palmProteinShare'], 0.8, 1e-9);
  });

  it('protein by palm on half the protein or less says nothing', () => {
    expect(find({ intake: days(0, 14, { palmProteinShare: 0.5 }) })).toEqual([]);
  });

  it('in maintenance a palm is close enough', () => {
    expect(find({ intake: days(0, 14, { palmProteinShare: 0.9 }), history: [targets(130, 'maintenance')] })).toEqual([]);
  });

  it('with an eating-disorder history weighing is never asked', () => {
    expect(find({ intake: days(0, 14, { palmProteinShare: 0.9 }), limited: true })).toEqual([]);
  });

  it('fewer than four weigh-ins a week', () => {
    const i = only(find({ weighIns: 5 }));
    expect(i.rule).toBe('weighInTiming');
    expect(i.figures['weighIns']).toBe(5);
    expect(find({ weighIns: 8 })).toEqual([]);
  });

  it('a stall arrives as an insight with its diagnosis', () => {
    const i = only(find({ stall: stalled }));
    expect(i.rule).toBe('stall');
    expect(i.stall?.diagnosis).toBe('estimate');
    expect(i.basisDays).toBe(21);
  });

  it('a single day far over target is not an insight', () => {
    expect(find({ intake: [day(0, { kcal: 3000 }), ...days(1, 14)] })).toEqual([]);
  });

  it('too few days is not a pattern', () => {
    expect(find({ intake: days(0, 5, { protein: 60 }) })).toEqual([]);
  });

  const everything = () =>
    find({
      intake: [...days(0, 9, { protein: 90, estimatedShare: 0.7 }), ...days(9, 14, { kcal: 600, mark: 'partial' })],
      weighIns: 3,
      stall: stalled,
    });

  it('every insight rests on at least seven days', () => {
    const all = everything();
    expect(all).toHaveLength(5);
    for (const i of all) {
      expect(i.basisDays, i.rule).toBeGreaterThanOrEqual(7);
    }
  });

  it('they come highest priority first', () => {
    expect(everything().map((i) => i.rule)).toEqual([
      'partialDays',
      'estimatesRising',
      'weighInTiming',
      'stall',
      'proteinShort',
    ]);
  });

  // `through` is a Saturday, so days 0, 6, 7 and 13 ago are the weekend days.
  const weekendDays = [0, 6, 7, 13];
  const daysAgo = (d: IntakeDay) => d.date.daysUntil(through);
  const week = (changes: (daysAgo: number) => Parameters<typeof day>[1]) => upTo(14).map((i) => day(i, changes(i)));

  it('weekends a fifth of the target above weekdays', () => {
    const i = only(find({ intake: week((d) => ({ kcal: weekendDays.includes(d) ? 2600 : 2100 })) }));
    expect(i.rule).toBe('weekendHigher');
    expect(i.figures['weekendDays']).toBe(4);
    expect(i.figures['weekdayDays']).toBe(10);
    expect(i.figures['weekendAverageKcal']).toBe(2600);
    expect(i.figures['weekdayAverageKcal']).toBe(2100);
    expect(i.figures['targetKcal']).toBe(2100);
  });

  it('a smaller weekend excess says nothing', () => {
    expect(find({ intake: week((d) => ({ kcal: weekendDays.includes(d) ? 2400 : 2100 })) })).toEqual([]);
  });

  it('one weekend day is not a pattern', () => {
    const intake = week((d) => ({ kcal: d === 0 ? 3200 : 2100 })).filter((d) => !weekendDays.slice(1).includes(daysAgo(d)));
    expect(find({ intake }).map((i) => i.rule)).not.toContain('weekendHigher');
  });

  it('the waist down beyond its noise while the trend held', () => {
    const waist = waistOn(tapeDown);
    const i = only(find({ trend: trend(0), waist }));
    expect(i.rule).toBe('waistAgainstWeight');
    expect(i.figures['waistToCm']).toBeLessThan(i.figures['waistFromCm'] as number);
    expect(i.figures['weightChangeKg']).toBe(0);
    expect(find({ trend: trend(-1.5), waist }), 'the scale moved too').toEqual([]);
    expect(find({ trend: trend(0), waist: waistOn([[13, 91.0], [1, 90.9]]) }), 'within the noise').toEqual([]);
  });

  it('in recomp the recomp signal says it instead', () => {
    const recomp = new TargetsRecord({
      effectiveFrom: through.addDays(-60),
      mode: 'recomp',
      tdeeKcal: 2700,
      tdeeSigmaKcal: 200,
      tdeeStatus: 'updated',
      targets: new DailyTargets({ kcal: 2400, proteinG: 160, proteinMinimumG: 130, fatG: 70, carbsG: 250, weeklyRateFraction: -0.002 }),
    });
    expect(find({ history: [recomp], trend: trend(0), waist: waistOn(tapeDown) })).toEqual([]);
  });

  it('the same weekday highest in both weeks', () => {
    const i = only(find({ intake: week((d) => ({ kcal: d === 2 || d === 9 ? 2700 : 2100 })) }));
    expect(i.rule).toBe('consistentDay');
    expect(i.figures['weekday']).toBe(through.addDays(-2).weekday);
    expect(i.figures['unlogged']).toBe(0);
    expect(i.figures['averageKcal']).toBe(2700);
  });

  it('the same weekday unlogged in both weeks', () => {
    const intake = week(() => ({})).filter((d) => ![3, 10].includes(daysAgo(d)));
    const i = only(find({ intake }));
    expect(i.rule).toBe('consistentDay');
    expect(i.figures['weekday']).toBe(through.addDays(-3).weekday);
    expect(i.figures['unlogged']).toBe(1);
  });

  it('a highest day that moves about is not consistent', () => {
    expect(find({ intake: week((d) => ({ kcal: d === 2 || d === 10 ? 2700 : 2100 })) })).toEqual([]);
  });

  it('with an eating-disorder history nothing is about weight, or about intake other than protein', () => {
    const waist = waistOn(tapeDown);
    const all = find({
      intake: week((d) => ({ protein: 90, kcal: weekendDays.includes(d) ? 2600 : d === 2 || d === 9 ? 2500 : 2100 })),
      weighIns: 3,
      stall: stalled,
      trend: trend(0),
      waist,
      limited: true,
    });
    expect(all.map((i) => i.rule)).toEqual(['proteinShort']);
  });
});

describe('rationing', () => {
  const insight = (rule: InsightRule) => new Insight({ rule, from: through.addDays(-13), to: through });

  const five = [
    insight('partialDays'),
    insight('estimatesRising'),
    insight('weighInTiming'),
    insight('stall'),
    insight('proteinShort'),
  ];

  const shown = (rule: InsightRule, daysAgo: number, dismissedDaysAgo?: number): InsightLogEntry => ({
    rule,
    shownOn: today.addDays(-daysAgo),
    dismissedOn: dismissedDaysAgo === undefined ? undefined : today.addDays(-dismissedDaysAgo),
  });

  it('with five rules satisfied, one is shown: the highest priority', () => {
    const s = selectInsight({ candidates: five, log: [], today });
    expect(s?.insight.rule).toBe('partialDays');
    expect(s?.isNew).toBe(true);
  });

  it('one new insight a day', () => {
    const s = selectInsight({ candidates: five, log: [shown('partialDays', 0, 0)], today });
    expect(s).toBeUndefined();
  });

  it('three new insights a week', () => {
    const log = [shown('partialDays', 5, 5), shown('estimatesRising', 3, 3), shown('weighInTiming', 1, 1)];
    expect(selectInsight({ candidates: five, log, today })).toBeUndefined();
    const later = selectInsight({ candidates: five, log, today: today.addDays(2) });
    expect(later?.insight.rule).toBe('stall');
  });

  it('an insight that is showing keeps showing', () => {
    const s = selectInsight({ candidates: five, log: [shown('stall', 4)], today });
    expect(s?.insight.rule).toBe('stall');
    expect(s?.isNew).toBe(false);
  });

  it('dismissed, a rule stays away for 28 days', () => {
    const one = [insight('proteinShort')];
    expect(selectInsight({ candidates: one, log: [shown('proteinShort', 12, 10)], today })).toBeUndefined();
    const back = selectInsight({ candidates: one, log: [shown('proteinShort', 30, 28)], today });
    expect(back?.isNew).toBe(true);
  });

  it('with no candidates there is nothing to show', () => {
    expect(selectInsight({ candidates: [], log: [], today })).toBeUndefined();
  });
});
