import { describe, expect, it } from 'vitest';
import { CalendarDate, FoodEntry, IntakeDay, RecoveryCheckIn } from '../../src/domain';
import {
  DailyTargets,
  type FiberPattern,
  findInsights,
  Insight,
  type InsightLogEntry,
  selectInsight,
  TargetsRecord,
} from '../../src/engine';
import { upTo } from '../support/upTo';

/**
 * MM-126: one insight, at most monthly, for a user on a deficit whose fiber
 * averages under half the guide and who reports high hunger or has no
 * recovery answers: fullness, with foods they already log.
 */
const through = CalendarDate.of(2026, 3, 14);
const today = through.addDays(1);

const record = (mode: 'fatLoss' | 'maintenance' = 'fatLoss') =>
  new TargetsRecord({
    effectiveFrom: through.addDays(-60),
    mode,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 200,
    tdeeStatus: 'updated',
    targets: new DailyTargets({ kcal: 2100, proteinG: 160, proteinMinimumG: 130, fatG: 70, carbsG: 220, weeklyRateFraction: -0.005 }),
  });

const intake = upTo(14).map(
  (i) =>
    new IntakeDay({ date: through.addDays(-i), kcal: 2100, proteinG: 150, carbsG: 200, fatG: 70, completeness: 'complete', estimatedShare: 0 }),
);

const entry = (date: CalendarDate, name: string, kcal: number, fiberG: number | undefined) =>
  new FoodEntry({ id: 0, date, meal: 'lunch', name, kcal, proteinG: 0, carbsG: 0, fatG: 0, source: 'weighed', fiberG });

/**
 * Each of the fortnight's days: 2,100 kcal carrying `fiberG` in all, and on
 * every day two small fiber-dense foods (lentils at 4 g in 230 kcal,
 * raspberries at 4 g in 64 kcal) inside that total.
 */
const daysWith = (fiberG: number | undefined, { typedShare = 0 }: { typedShare?: number } = {}) =>
  new Map(
    upTo(14).map((i) => {
      const date = through.addDays(-i);
      const typed = typedShare * 2100;
      const foods = [
        entry(date, 'Lunch plate', 2100 - typed - 294, fiberG === undefined ? undefined : fiberG - 8),
        entry(date, i % 2 === 0 ? 'Lentils' : 'lentils ', 230, fiberG === undefined ? undefined : 4),
        entry(date, 'Raspberries', 64, fiberG === undefined ? undefined : 4),
        ...(typed > 0 ? [entry(date, 'Typed dinner', typed, undefined)] : []),
      ];
      return [date, foods] as const;
    }),
  );

const checkIn = (daysAgo: number, hunger: number) =>
  new RecoveryCheckIn({ date: through.addDays(-daysAgo), hunger, energy: 3, sleep: 3, training: 3, mood: 3 });

const find = ({
  days = daysWith(18),
  checkIns = [],
  mode,
  limited = false,
  fiber = true,
}: {
  days?: FiberPattern['days'];
  checkIns?: RecoveryCheckIn[];
  mode?: 'fatLoss' | 'maintenance';
  limited?: boolean;
  fiber?: boolean;
} = {}) =>
  findInsights({
    through,
    intake,
    weights: [...upTo(14).map((i) => ({ date: through.addDays(-i), weightKg: 85 })), { date: through.addDays(-40), weightKg: 86 }],
    history: [record(mode)],
    limitToProteinAndLogging: limited,
    fiber: fiber ? { sex: 'male', days, checkIns } : undefined,
  }).filter((i) => i.rule === 'fiberForFullness');

describe('when it is found', () => {
  // A man on 2,100 kcal: the guide is 29.4 g (14 g per 1,000 kcal), so under half is under 14.7 g.
  it('on a deficit, under half the guide, with no check-in to say', () => {
    expect(find(), '18 g is over half').toEqual([]);
    const [low] = find({ days: daysWith(12) });
    expect(low?.figures['countedDays']).toBe(14);
    expect(low?.figures['averageG']).toBeCloseTo(12);
    expect(low?.figures['guideG']).toBeCloseTo(29.4);
  });

  it('with hunger at the hard end at the latest check-in', () => {
    expect(find({ days: daysWith(12), checkIns: [checkIn(9, 4), checkIn(2, 2)] })).toHaveLength(1);
  });

  it('not when the latest check-in says hunger is fine', () => {
    expect(find({ days: daysWith(12), checkIns: [checkIn(9, 1), checkIn(2, 4)] })).toEqual([]);
  });

  it('not off a deficit', () => {
    expect(find({ days: daysWith(12), mode: 'maintenance' })).toEqual([]);
  });

  it('not at half the guide or more', () => {
    expect(find({ days: daysWith(15) })).toEqual([]);
  });

  it('days with too little fiber data are left out, never read as zero', () => {
    // 40% of each day typed: no day carries enough, so there is no basis at all.
    expect(find({ days: daysWith(12, { typedShare: 0.4 }) })).toEqual([]);
    expect(find({ days: daysWith(undefined) })).toEqual([]);
  });

  it('below Full detail there is no fiber pattern, and so nothing', () => {
    expect(find({ days: daysWith(12), fiber: false })).toEqual([]);
  });

  it('with an eating-disorder history it is left out (MM-141, intake other than protein)', () => {
    expect(find({ days: daysWith(12), limited: true })).toEqual([]);
  });
});

describe('its examples', () => {
  it('are the densest foods already logged, each name once', () => {
    const [found] = find({ days: daysWith(12) });
    expect(found?.examples).toEqual(['Raspberries', 'Lentils']);
  });

  it('are left out when fewer than two foods qualify', () => {
    const days = new Map([...daysWith(12)].map(([date, foods]) => [date, foods.filter((f) => f.name !== 'Raspberries')] as const));
    const [found] = find({ days });
    expect(found).toBeDefined();
    expect(found?.examples).toEqual([]);
  });
});

describe('rationing', () => {
  const fiber = new Insight({ rule: 'fiberForFullness', from: through.addDays(-13), to: through });
  const shown = (daysAgo: number, dismissedDaysAgo: number): InsightLogEntry => ({
    rule: 'fiberForFullness',
    shownOn: today.addDays(-daysAgo),
    dismissedOn: today.addDays(-dismissedDaysAgo),
  });

  it('at most monthly: not new again within 30 days of being shown', () => {
    expect(selectInsight({ candidates: [fiber], log: [], today })?.isNew).toBe(true);
    // Dismissed at once 29 days ago: past the 28 quiet days after a dismissal, still inside the month.
    expect(selectInsight({ candidates: [fiber], log: [shown(29, 29)], today })).toBeUndefined();
    expect(selectInsight({ candidates: [fiber], log: [shown(30, 30)], today })?.isNew).toBe(true);
  });
});
