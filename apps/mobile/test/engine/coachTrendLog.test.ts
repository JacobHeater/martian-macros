import { describe, expect, it } from 'vitest';
import type { CalendarDate } from '../../src/domain/CalendarDate';
import { arrangeCoachFindings } from '../../src/engine/analysis/arrangeCoachFindings';
import { canonicalTrendSpan } from '../../src/engine/analysis/canonicalTrendSpan';
import type { CoachFinding } from '../../src/engine/analysis/CoachFinding';
import type { CoachFindingKind } from '../../src/engine/analysis/CoachFindingKind';
import type { CoachSpanEvaluation } from '../../src/engine/analysis/CoachSpanEvaluation';
import { coachTrendReadingOf } from '../../src/engine/analysis/coachTrendReadingOf';
import { coachTrendSteps } from '../../src/engine/analysis/coachTrendSteps';
import { foodSpanAnalysisOf } from '../../src/engine/analysis/food/foodSpanAnalysisOf';
import { selectDashboardInsight } from '../../src/engine/analysis/selectDashboardInsight';
import { snoozedFoodNames } from '../../src/engine/analysis/snoozedFoodNames';
import { Insight } from '../../src/engine/Insight';
import type { InsightLogEntry } from '../../src/engine/InsightLogEntry';
import type { InsightPriority } from '../../src/engine/InsightPriority';
import { InsightRule } from '../../src/engine/InsightRule';
import type { TrendAnnouncement } from '../../src/engine/trends/TrendAnnouncement';
import { fortnight, inputOf, plainDay, yesterday } from './support/foodAnalysis';
import { trendFinding } from './support/trendFinding';

/**
 * MM-605's announcement log written from the coach's analysis (MM-610): the
 * readings of a finding id as of E, E−1 and E−2, the steps the state
 * machine takes, N1's exit at 65%, and the Dashboard's card from the same
 * engine under MM-141's ration.
 */
const today = yesterday.addDays(1);
const e = yesterday;

const finding = (
  signal: string,
  kind: CoachFindingKind = 'fix',
  { figures = { direction: 1 }, priority = kind === 'dataQuality' ? 'dataQuality' : 'coaching' }: { figures?: Record<string, number>; priority?: InsightPriority } = {},
): CoachFinding => ({
  id: kind === 'fix' ? `${signal}:level` : `${signal}:${kind}`,
  signal,
  kind,
  span: 14,
  from: e.addDays(-13),
  to: e,
  priority,
  figures,
  foods: [],
  trade: undefined,
  trend: undefined,
});

const evaluation = (
  asOf: CalendarDate,
  findings: readonly CoachFinding[],
  { held = false, unresolved = [] }: { held?: boolean; unresolved?: readonly string[] } = {},
): CoachSpanEvaluation => ({ span: 14, asOf, findings, held, unresolved: new Set(unresolved) });

/** E, E−1 and E−2 with the same findings each day, unless given per day. */
const days = (each: readonly (readonly CoachFinding[])[], options: Parameters<typeof evaluation>[2] = {}) => ({
  asOf: evaluation(e, each[0] ?? [], options),
  dayBefore: evaluation(e.addDays(-1), each[1] ?? each[0] ?? [], options),
  twoDaysBefore: evaluation(e.addDays(-2), each[2] ?? each[1] ?? each[0] ?? [], options),
});

const entry = (key: string, transition: TrendAnnouncement['transition'], on: CalendarDate, direction: 'up' | 'down' = 'up'): TrendAnnouncement => ({
  key,
  transition,
  on,
  direction,
  onsetDate: undefined,
  figures: { effect: 0, unit: 'finding', n: 0, k: 0, span: 14, coverage: 0 },
  tier: 'clear',
  rulesVersion: 1,
});

describe('the canonical span', () => {
  it('is 2w when supported, else the longest supported span of at most 30 days, and never 1d', () => {
    expect(canonicalTrendSpan([1, 7, 14, 30, 90])).toBe(14);
    expect(canonicalTrendSpan([1, 7, 30])).toBe(30);
    expect(canonicalTrendSpan([1, 7])).toBe(7);
    expect(canonicalTrendSpan([1])).toBeUndefined();
  });
});

describe("a finding id's reading", () => {
  it('a level rule said is detected, clear and of no size; not said is quiet and over; with too little data, held', () => {
    const fat = finding('fatAgainstTarget');
    const said = coachTrendReadingOf('fatAgainstTarget:level', evaluation(e, [fat]));
    expect(said).toMatchObject({ status: 'detected', exited: { up: false, down: true } });
    expect(said.finding).toMatchObject({ key: 'fatAgainstTarget:level', direction: 'up', tier: 'clear', effect: 0, span: 14 });
    expect(coachTrendReadingOf('fatAgainstTarget:level', evaluation(e, []))).toMatchObject({ status: 'quiet', exited: { up: true, down: true } });
    expect(coachTrendReadingOf('fatAgainstTarget:level', evaluation(e, [], { held: true }))).toMatchObject({
      status: 'held',
      exited: { up: false, down: false },
    });
  });

  it('a fix with a trend carries its tier and size under the finding id', () => {
    const withTrend: CoachFinding = { ...finding('calories'), trend: trendFinding({ signal: 'calories', aspect: 'drift', tier: 'strong', effect: 250 }) };
    const reading = coachTrendReadingOf('calories:level', evaluation(e, [withTrend]));
    expect(reading.finding).toMatchObject({ key: 'calories:level', tier: 'strong', effect: 250 });
  });

  it('a data-quality limit holds the composition keys it quiets, never resolving them', () => {
    const quality = finding('partialDays', 'dataQuality');
    expect(coachTrendReadingOf('fatAgainstTarget:level', evaluation(e, [quality])).status).toBe('held');
    expect(coachTrendReadingOf('partialDays:dataQuality', evaluation(e, [quality])).status).toBe('detected');
  });
});

describe('the steps for one day', () => {
  it('new needs the finding as of E and E−1; one day alone is pending, and nothing is appended', () => {
    const fat = finding('fatAgainstTarget');
    const both = coachTrendSteps({ log: [], ...days([[fat], [fat], []]) });
    expect(both.get('fatAgainstTarget:level')).toMatchObject({ transition: 'new', announced: true, append: { key: 'fatAgainstTarget:level', transition: 'new', on: e } });
    const once = coachTrendSteps({ log: [], ...days([[fat], [], []]) });
    expect(once.get('fatAgainstTarget:level')?.append).toBeUndefined();
  });

  it('idempotent against the log: a key already entered for E is not stepped again', () => {
    const fat = finding('fatAgainstTarget');
    const first = coachTrendSteps({ log: [], ...days([[fat]]) });
    const appended = [...first.values()].flatMap((s) => (s.append === undefined ? [] : [s.append]));
    expect(appended).toHaveLength(1);
    const again = coachTrendSteps({ log: appended, ...days([[fat]]) });
    expect([...again.values()].flatMap((s) => (s.append === undefined ? [] : [s.append]))).toEqual([]);
  });

  it('a reported finding continues silently, resolves once gone as of E, E−1 and E−2, and is held, not resolved, without data', () => {
    const log = [entry('fatAgainstTarget:level', 'new', e.addDays(-10))];
    const fat = finding('fatAgainstTarget');
    expect(coachTrendSteps({ log, ...days([[fat]]) }).get('fatAgainstTarget:level')).toMatchObject({ transition: 'continuing', append: undefined });
    expect(coachTrendSteps({ log, ...days([[], [], [fat]]) }).get('fatAgainstTarget:level')?.transition).toBe('continuing');
    expect(coachTrendSteps({ log, ...days([[]]) }).get('fatAgainstTarget:level')).toMatchObject({
      transition: 'resolved',
      announced: true,
      append: { transition: 'resolved' },
    });
    expect(coachTrendSteps({ log, ...days([[]], { held: true }) }).get('fatAgainstTarget:level')).toMatchObject({ transition: 'held', announced: false });
  });

  it('a 1d finding is never a key: what is left today goes nowhere near the log', () => {
    const left: CoachFinding = { ...finding('left', 'left'), id: 'day:left', span: 1 };
    expect(coachTrendSteps({ log: [], ...days([[left]]) }).size).toBe(0);
  });
});

describe("N1's exit at 65% (MM-606)", () => {
  /** 14 whole days, the 140 g minimum met on `met` of them. */
  const metOn = (met: number) =>
    inputOf(fortnight.map((date, i) => ({ date, entries: plainDay(date, 2400, i < met ? 150 : 120, 70) })));

  it('said under 50% of days met; between 50% and 65% not said, yet not over; at 65% over', () => {
    const short = foodSpanAnalysisOf(metOn(5), 14, yesterday);
    expect(short.findings.map((f) => f.id)).toContain('proteinMinimum:level');
    const between = foodSpanAnalysisOf(metOn(8), 14, yesterday);
    expect(between.findings.filter((f) => f.kind === 'fix').map((f) => f.id)).not.toContain('proteinMinimum:level');
    expect(between.unresolved.has('proteinMinimum:level')).toBe(true);
    const over = foodSpanAnalysisOf(metOn(10), 14, yesterday);
    expect(over.unresolved.has('proteinMinimum:level')).toBe(false);
  });

  it('through the state machine: a reported N1 stays while 8 of 14 days are met, and resolves at 10', () => {
    const log = [entry('proteinMinimum:level', 'new', e.addDays(-10), 'down')];
    const step = (unresolved: readonly string[]) =>
      coachTrendSteps({ log, ...days([[]], { unresolved }) }).get('proteinMinimum:level')?.transition;
    expect(step(['proteinMinimum:level'])).toBe('continuing');
    expect(step([])).toBe('resolved');
  });
});

describe('transitions in the ranking', () => {
  it("a finding's transition, keyed by its id as the log keys it, ranks it: new before continuing", () => {
    const fat = finding('fatAgainstTarget');
    const fiber = finding('fiber');
    const continuing = arrangeCoachFindings([fat, fiber], { today });
    expect(continuing.worthChanging.map((f) => f.id)).toEqual(['fatAgainstTarget:level', 'fiber:level']);
    const fiberNew = arrangeCoachFindings([fat, fiber], { today, transitions: new Map([['fiber:level', 'new']]) });
    expect(fiberNew.worthChanging.map((f) => f.id)).toEqual(['fiber:level', 'fatAgainstTarget:level']);
  });
});

describe("the Dashboard's card", () => {
  const fat = finding('fatAgainstTarget');
  const fiber = finding('fiber');
  const sodium = finding('sodium');
  const rule = (r: InsightRule, figures: Record<string, number> = {}) => new Insight({ rule: r, from: e.addDays(-13), to: e, figures });
  const shown = (on: CalendarDate, r: InsightRule, dismissedOn?: CalendarDate): InsightLogEntry => ({ rule: r, shownOn: on, dismissedOn });

  it('shows the top finding announced as of yesterday, from the day after', () => {
    const log = [entry('fatAgainstTarget:level', 'new', e), entry('fiber:level', 'new', e)];
    expect(selectDashboardInsight({ today, findings: [fat, fiber], announcements: log, rules: [], insightLog: [] })).toEqual({
      kind: 'finding',
      finding: fat,
      transition: 'new',
    });
  });

  it('nothing announced, nothing from the analysis: a finding that continues silently is for the Coach tab', () => {
    expect(selectDashboardInsight({ today, findings: [fat], announcements: [], rules: [], insightLog: [] })).toBeUndefined();
  });

  it('under the ration: one new a day, three a week, counted from the announcement log; the latest start that holds shows', () => {
    // Five days running each announced something new. Fat, fiber and sodium started on the card, a day each; calories,
    // the fourth in a week, waited; carbohydrate, announced yesterday, would be the fourth too.
    const keys = ['fatAgainstTarget', 'fiber', 'sodium', 'calories', 'carbohydrate'];
    const log = keys.map((k, i) => entry(`${k}:level`, 'new', e.addDays(i - keys.length + 1)));
    const all = keys.map((k) => finding(k));
    const card = (findings: readonly CoachFinding[]) => selectDashboardInsight({ today, findings, announcements: log, rules: [], insightLog: [] });
    expect(card(all)).toMatchObject({ kind: 'finding', finding: { id: 'sodium:level' } });
    // Sodium dismissed: the one started before it, while it still holds, shows again.
    expect(card(all.filter((f) => f.signal !== 'sodium'))).toMatchObject({ finding: { id: 'fiber:level' } });
    // Only the two that never started hold: the week's three starts are spent, so neither shows.
    expect(card(all.filter((f) => f.signal === 'calories' || f.signal === 'carbohydrate'))).toBeUndefined();
  });

  it("a day's later announcements never reach the card: only its top starts, the rest wait on the Coach tab", () => {
    const log = [entry('fatAgainstTarget:level', 'new', e.addDays(-1)), entry('fiber:level', 'new', e.addDays(-1))];
    expect(selectDashboardInsight({ today, findings: [fiber], announcements: log, rules: [], insightLog: [] })).toBeUndefined();
  });

  it('a rule shown today counts against the same ration', () => {
    const log = [entry('fatAgainstTarget:level', 'new', e)];
    expect(
      selectDashboardInsight({ today, findings: [fat], announcements: log, rules: [], insightLog: [shown(today, 'weekendHigher', today)] }),
    ).toBeUndefined();
  });

  it('dismissed (on either tab), the finding is hidden from the analysis and so from the card; nothing else starts that day', () => {
    const log = [entry('fatAgainstTarget:level', 'new', e)];
    const weighIns = rule('weighInTiming', { weighIns: 5 });
    expect(
      selectDashboardInsight({
        today,
        findings: [],
        announcements: log,
        rules: [weighIns],
        insightLog: [],
        dismissals: [{ findingId: 'fatAgainstTarget:level', dismissedOn: today }],
      }),
    ).toBeUndefined();
  });

  it('resolved good news is shown as the signal’s holding-up line', () => {
    const holding = finding('proteinMinimum', 'holdingUp');
    const log = [entry('proteinMinimum:level', 'new', e.addDays(-20), 'down'), entry('proteinMinimum:level', 'resolved', e, 'down')];
    expect(selectDashboardInsight({ today, findings: [holding], announcements: log, rules: [], insightLog: [] })).toEqual({
      kind: 'finding',
      finding: holding,
      transition: 'resolved',
    });
    expect(selectDashboardInsight({ today, findings: [], announcements: log, rules: [], insightLog: [] })).toBeUndefined();
  });

  describe('the old rules the analysis has no equivalent of', () => {
    it('which they are: protein short, protein by meal and sodium have one; the rest keep their rule', () => {
      expect(InsightRule.values.filter((r) => InsightRule.analysisSignal(r) !== undefined)).toEqual(['proteinShort', 'sodiumOverLimit', 'proteinByMeal']);
      for (const r of ['stall', 'shortSleep', 'waistAgainstWeight', 'weighInTiming', 'partialDays', 'estimatesRising'] as const) {
        expect(InsightRule.analysisSignal(r)).toBeUndefined();
      }
    });

    it('still shown where the analysis has nothing, and logged as new', () => {
      const waist = rule('waistAgainstWeight', { waistFromCm: 92, waistToCm: 90, weightChangeKg: 0 });
      expect(selectDashboardInsight({ today, findings: [fat], announcements: [], rules: [waist], insightLog: [] })).toEqual({
        kind: 'rule',
        insight: waist,
        isNew: true,
      });
    });

    it('the higher priority wins a new start: the stall (coaching) over a pattern, a data-quality rule over a coaching finding', () => {
      const log = [entry('sodium:level', 'new', e)];
      const patternSodium = { ...sodium, priority: 'pattern' as const };
      const stall = new Insight({ rule: 'stall', from: e.addDays(-20), to: e });
      expect(selectDashboardInsight({ today, findings: [patternSodium], announcements: log, rules: [stall], insightLog: [] })).toMatchObject({
        kind: 'rule',
        insight: { rule: 'stall' },
      });
      const partial = rule('partialDays', { loggedDays: 13, partialDays: 6 });
      expect(selectDashboardInsight({ today, findings: [sodium], announcements: log, rules: [partial], insightLog: [] })).toMatchObject({
        kind: 'rule',
        insight: { rule: 'partialDays' },
      });
      // A tie goes to the analysis.
      const sleep = rule('shortSleep', { averageMinutes: 340, nights: 12 });
      expect(selectDashboardInsight({ today, findings: [sodium], announcements: log, rules: [sleep], insightLog: [] })).toMatchObject({
        kind: 'finding',
      });
    });

    it('a rule already showing keeps showing while it holds', () => {
      const waist = rule('waistAgainstWeight', { waistFromCm: 92, waistToCm: 90, weightChangeKg: 0 });
      const log = [entry('fatAgainstTarget:level', 'new', e)];
      expect(
        selectDashboardInsight({ today, findings: [fat], announcements: log, rules: [waist], insightLog: [shown(e.addDays(-3), 'waistAgainstWeight')] }),
      ).toEqual({ kind: 'rule', insight: waist, isNew: false });
    });

    it('partial days and estimates rising stay with their rules: the analysis’s own are left off the card', () => {
      const quality = finding('partialDays', 'dataQuality');
      const log = [entry('partialDays:dataQuality', 'new', e)];
      expect(selectDashboardInsight({ today, findings: [quality], announcements: log, rules: [], insightLog: [] })).toBeUndefined();
    });
  });
});

describe('snoozed foods', () => {
  it('a food kind snoozed and still quiet, by name in lower case; a lapsed or non-food snooze is not one', () => {
    const names = snoozedFoodNames(
      [
        { kind: 'mostlyFat', subject: ' Peanut Butter ', item: 'Peanut Butter', resumesOn: today.addDays(3) },
        { kind: 'portionCheck', subject: 'Garlic bread', item: 'Garlic bread', resumesOn: undefined },
        { kind: 'lightOnProtein', subject: 'Toast', item: 'Toast', resumesOn: today },
        { kind: 'volumeJump', subject: 'bench', item: 'Bench press', resumesOn: undefined },
      ],
      today,
    );
    expect([...names].sort()).toEqual(['garlic bread', 'peanut butter']);
  });
});

