import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { DayCompleteness } from '../../src/domain/DayCompleteness';
import { IntakeDay } from '../../src/domain/IntakeDay';
import { TargetShape } from '../../src/domain/TargetShape';
import { WeekShape } from '../../src/domain/WeekShape';
import { buildMonthlyReport } from '../../src/engine/buildMonthlyReport';
import { DailyTargets } from '../../src/engine/DailyTargets';
import { findInsights } from '../../src/engine/findInsights';
import { findUnderEating } from '../../src/engine/findUnderEating';
import { loggingStreakOf } from '../../src/engine/loggingStreakOf';
import { plannedDayShare } from '../../src/engine/plannedDayShare';
import { ReportPeriod } from '../../src/engine/ReportPeriod';
import { StreakRule } from '../../src/engine/StreakRule';
import { summarizeAdherence } from '../../src/engine/summarizeAdherence';
import { TargetsRecord } from '../../src/engine/TargetsRecord';

/**
 * MM-124 on MM-27, MM-92, MM-114, MM-141, MM-149 and MM-33: every reader that
 * judges a day's intake reads a shaped week against its plan, as the
 * expenditure estimate does. Three higher days 30% up on 2,000 kcal give
 * 2,400 on Monday, Wednesday and Friday and 1,700 (held to 15% under) on the
 * other four. The lower days are eaten a little under plan, at 1,550: read
 * flat they fall under 65% of the higher days and were taken for partial.
 */
const start = CalendarDate.of(2026, 9, 7); // a Monday
const threeHigher = new WeekShape({ higherDays: [1, 3, 5], raise: 0.3 });
const shapes = [new TargetShape({ since: start.addDays(-60), week: threeHigher })];
const plannedShare = plannedDayShare(shapes);

const day = (date: CalendarDate, kcal: number, completeness: DayCompleteness = 'unmarked') =>
  new IntakeDay({ date, kcal, proteinG: 150, carbsG: 200, fatG: 60, completeness });

/** `count` days from `from`, each eaten at `higher` or `lower` by the week's plan, with `override` for single days. */
const shapedDays = ({
  from = start,
  count,
  week = threeHigher,
  higher,
  lower,
  override = new Map<number, number>(),
}: {
  from?: CalendarDate;
  count: number;
  week?: WeekShape;
  higher: number;
  lower: number;
  override?: ReadonlyMap<number, number>;
}) =>
  Array.from({ length: count }, (_, i) => {
    const date = from.addDays(i);
    return day(date, override.get(i) ?? (week.higherDays.has(date.weekday) ? higher : lower));
  });

const targets = (kcal = 2000) =>
  new TargetsRecord({
    effectiveFrom: start.addDays(-60),
    targets: new DailyTargets({ kcal, proteinG: 160, proteinMinimumG: 130, fatG: 70, carbsG: 220, weeklyRateFraction: -0.005 }),
    mode: 'fatLoss',
    tdeeKcal: 2600,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
  });

/** The index of the first lower day on or after `offset` days from `start`. */
const lowerDayFrom = (offset: number) => {
  let i = offset;
  while (threeHigher.higherDays.has(start.addDays(i).weekday)) i++;
  return i;
};

describe('the adherence summary reads a shaped week against its plan (MM-149)', () => {
  const through = start.addDays(27);
  const summarize = (intake: readonly IntakeDay[], share?: (date: CalendarDate) => number) =>
    summarizeAdherence({ through, intake, weights: [], history: [targets()], floorKcal: 1200, plannedShare: share });

  it('read flat, the lower days are left out and the week reads as over', () => {
    const s = summarize(shapedDays({ count: 28, higher: 2400, lower: 1550 }));
    expect(s.completeDays).toBe(3);
    expect(s.standing).toBe('above');
  });

  it('read against the plan, every day counts and the week is on target', () => {
    const s = summarize(shapedDays({ count: 28, higher: 2400, lower: 1550 }), plannedShare);
    expect(s.completeDays).toBe(7);
    expect(s.averageTargetKcal).toBeCloseTo(2000, 6);
    expect(s.standing).toBe('onTarget');
  });

  it('a week resting on its lower days alone is held to the lower days\' plan, not read as under', () => {
    const intake = shapedDays({ count: 28, higher: 2400, lower: 1700 }).filter(
      (d) => d.date.isBefore(start.addDays(21)) || !threeHigher.higherDays.has(d.date.weekday),
    );
    expect(summarize(intake).standing).toBe('below');
    const s = summarize(intake, plannedShare);
    expect(s.completeDays).toBe(4);
    expect(s.averageTargetKcal).toBeCloseTo(1700, 6);
    expect(s.standing).toBe('onTarget');
  });

  it('a genuinely half-logged lower day is still partial', () => {
    const half = lowerDayFrom(21);
    const s = summarize(shapedDays({ count: 28, higher: 2400, lower: 1550, override: new Map([[half, 775]]) }), plannedShare);
    expect(s.completeDays).toBe(6);
  });
});

describe('the under-eating notice reads a shaped week against its plan (MM-114)', () => {
  const through = start.addDays(13);
  const find = (intake: readonly IntakeDay[], share?: (date: CalendarDate) => number) =>
    findUnderEating({ through, intake, floorKcal: 1200, plannedShare: share });

  it('a shaped week eaten as planned, lower days a little under, is not under-eating', () => {
    expect(find(shapedDays({ count: 14, higher: 2400, lower: 1550 }), plannedShare)).toBeUndefined();
  });

  it('real under-eating on a shaped week is no longer hidden by taking the lower days for partial', () => {
    const intake = shapedDays({ count: 14, higher: 1250, lower: 800 });
    expect(find(intake)).toBeUndefined();
    const finding = find(intake, plannedShare);
    expect(finding?.days).toBe(14);
    expect(finding?.averageKcal).toBeCloseTo((6 * 1250 + 8 * 800) / 14, 6);
  });

  it('a genuinely half-logged day is still left out', () => {
    const half = lowerDayFrom(0);
    const finding = find(shapedDays({ count: 14, higher: 1250, lower: 800, override: new Map([[half, 300]]) }), plannedShare);
    expect(finding?.days).toBe(13);
    expect(finding?.lowDays).not.toContainEqual(start.addDays(half));
  });
});

describe('the logging streak reads a shaped week against its plan (MM-92)', () => {
  const today = start.addDays(28);

  it('read flat, the lower days break it', () => {
    const streak = loggingStreakOf({ today, intake: shapedDays({ count: 28, higher: 2400, lower: 1550 }) });
    expect(streak.days).toBeLessThan(StreakRule.showFromDays);
  });

  it('read against the plan, every day of four shaped weeks counts', () => {
    const streak = loggingStreakOf({ today, intake: shapedDays({ count: 28, higher: 2400, lower: 1550 }), plannedShare });
    expect(streak.days).toBe(28);
    expect(streak.forgivenOn).toBeUndefined();
  });

  it('a genuinely half-logged day is a missed day, forgiven once', () => {
    const half = lowerDayFrom(10);
    const streak = loggingStreakOf({
      today,
      intake: shapedDays({ count: 28, higher: 2400, lower: 1550, override: new Map([[half, 775]]) }),
      plannedShare,
    });
    expect(streak.days).toBe(27);
    expect(streak.forgivenOn).toEqual(start.addDays(half));
  });
});

describe('insights read a shaped week against its plan (MM-141, MM-27)', () => {
  const through = start.addDays(13);
  const rules = (intake: readonly IntakeDay[], share?: (date: CalendarDate) => number) =>
    findInsights({ through, intake, weights: [], history: [targets()], plannedShare: share }).map((i) => i.rule);

  it('planned lower days are not partial days', () => {
    const intake = shapedDays({ count: 14, higher: 2400, lower: 1550 });
    expect(rules(intake)).toContain('partialDays');
    expect(rules(intake, plannedShare)).not.toContain('partialDays');
  });

  it('genuinely half-logged days still are', () => {
    const halves = [0, 2, 4, 6, 8].map((n) => lowerDayFrom(n));
    const unique = [...new Set(halves)];
    const intake = shapedDays({ count: 14, higher: 2400, lower: 1550, override: new Map(unique.map((i) => [i, 775])) });
    const insight = findInsights({ through, intake, weights: [], history: [targets()], plannedShare }).find(
      (i) => i.rule === 'partialDays',
    );
    expect(unique.length * 3).toBeGreaterThan(14);
    expect(insight?.figures['partialDays']).toBe(unique.length);
  });

  it('a planned higher weekend is not "weekends run higher"', () => {
    const weekend = new WeekShape({ higherDays: [6, 0], raise: 0.2 });
    const share = plannedDayShare([new TargetShape({ since: start.addDays(-60), week: weekend })]);
    // Four weeks: the weekend rule pairs each weekend with its own week and needs three agreeing (MM-615).
    const intake = shapedDays({ from: start.addDays(-14), count: 28, week: weekend, higher: 2400, lower: 1840 });
    expect(rules(intake)).toContain('weekendHigher');
    expect(rules(intake, share)).not.toContain('weekendHigher');
  });

  it('a planned higher day is not "your highest day"', () => {
    const friday = new WeekShape({ higherDays: [5], raise: 0.3 });
    const share = plannedDayShare([new TargetShape({ since: start.addDays(-60), week: friday })]);
    const intake = shapedDays({ count: 14, week: friday, higher: 2600, lower: 1900 });
    expect(rules(intake)).toContain('consistentDay');
    expect(rules(intake, share)).not.toContain('consistentDay');
  });
});

describe('the monthly report reads a shaped month against its plan (MM-33, MM-92)', () => {
  const period = new ReportPeriod({ index: 0, from: start });
  const report = (intake: readonly IntakeDay[], share?: (date: CalendarDate) => number) =>
    buildMonthlyReport({ period, intake, weights: [], waist: [], history: [targets()], trend: [], plannedShare: share });

  it('read flat, the lower days are not whole days and the run is short', () => {
    const r = report(shapedDays({ count: 28, higher: 2400, lower: 1550 }));
    expect(r.completeDays).toBe(12);
    expect(r.longestRunDays).toBeLessThan(StreakRule.showFromDays);
  });

  it('read against the plan, every day is whole and the run is the month', () => {
    const r = report(shapedDays({ count: 28, higher: 2400, lower: 1550 }), plannedShare);
    expect(r.completeDays).toBe(28);
    expect(r.longestRunDays).toBe(28);
  });

  it('a genuinely half-logged day is still partial', () => {
    const half = lowerDayFrom(10);
    const r = report(shapedDays({ count: 28, higher: 2400, lower: 1550, override: new Map([[half, 775]]) }), plannedShare);
    expect(r.completeDays).toBe(27);
    expect(r.longestRunDays).toBe(27);
  });
});
