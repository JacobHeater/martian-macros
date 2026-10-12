import { describe, expect, it } from 'vitest';
import { CalendarDate, type DayCompleteness, IntakeDay, type WeightObservation } from '../../src/domain';
import {
  DailyTargets,
  findInsights,
  Insight,
  type InsightLogEntry,
  type InsightRule,
  selectInsight,
  StallAssessment,
  TargetsRecord,
} from '../../src/engine';
import { expectClose } from '../support/expectClose';
import { upTo } from '../support/upTo';

/** MM-141: insights from a fixed catalog of rules, rationed. */
const through = CalendarDate.of(2026, 3, 14);
const today = through.addDays(1);

const targets = (proteinMinimumG = 130) =>
  new TargetsRecord({
    effectiveFrom: through.addDays(-60),
    mode: 'fatLoss',
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
  }: { kcal?: number; protein?: number; mark?: DayCompleteness; estimatedShare?: number } = {},
) =>
  new IntakeDay({
    date: through.addDays(-daysAgo),
    kcal,
    proteinG: protein,
    carbsG: 200,
    fatG: 70,
    completeness: mark,
    estimatedShare,
  });

/** Days `from` up to but not including `to`, each made with `changes`. */
const days = (from: number, to: number, changes: Parameters<typeof day>[1] = {}) =>
  upTo(to - from).map((i) => day(from + i, changes));

const weighed = (count: number): WeightObservation[] => [
  ...upTo(count).map((i) => ({ date: through.addDays(-i), weightKg: 85 })),
  { date: through.addDays(-40), weightKg: 86 },
];

const find = ({
  intake,
  weighIns = 14,
  stall,
  limited = false,
}: { intake?: IntakeDay[]; weighIns?: number; stall?: StallAssessment; limited?: boolean } = {}) =>
  findInsights({
    through,
    intake: intake ?? days(0, 14),
    weights: weighed(weighIns),
    history: [targets()],
    stall,
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

  it('with an eating-disorder history nothing is about weight', () => {
    const all = find({ intake: days(0, 14, { protein: 90 }), weighIns: 3, stall: stalled, limited: true });
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
