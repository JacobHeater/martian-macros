import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain';
import {
  evaluateSignal,
  nextTrendTransition,
  type TrendAnnouncement,
  type TrendBoundary,
  type TrendDay,
  type TrendEvaluation,
  type TrendReading,
  type TrendSignal,
  type TrendSpan,
  type TrendTransition,
} from '../../src/engine';
import { trendDays } from './support/trendDays';
import { trendSignal } from './support/trendSignal';

/**
 * MM-605's scenarios that the pure engine answers: evaluations of
 * hand-built series, and the state machine run over them day by day.
 */
const pattern = [-1, -0.5, 0, 0.5, 1];
/** A steady value with a regular wobble: σ is 1.4826 × half the amplitude. */
const wobble = (center: number, i: number, amplitude = 100) => center + amplitude * (pattern[i % 5] as number);

const yesterday = CalendarDate.of(2026, 10, 20);
const first = yesterday.addDays(-59);
/** 50 steady days, then 10 days 150 kcal higher (about 2σ, and over δ 100). */
const stepAt = first.addDays(50);
const stepped = trendDays(
  first,
  Array.from({ length: 60 }, (_, i) => wobble(i < 50 ? 2000 : 2150, i)),
);

const reading = (evaluation: TrendEvaluation, aspect: string) => evaluation.readings.find((r) => r.aspect === aspect) as TrendReading;

/** Runs every key's state machine from `from` to `to`, evaluating as of each day, and returns the transitions by key. */
function runMachine(
  signal: TrendSignal<readonly TrendDay[]>,
  series: readonly TrendDay[],
  from: CalendarDate,
  to: CalendarDate,
  span: TrendSpan = 30,
): Map<string, TrendTransition[]> {
  const evaluations = new Map<number, TrendEvaluation>();
  const at = (date: CalendarDate) => {
    let found = evaluations.get(date.epochDay);
    if (found === undefined) {
      found = evaluateSignal(signal, series, date, span);
      evaluations.set(date.epochDay, found);
    }
    return found;
  };
  const logs = new Map<string, TrendAnnouncement[]>();
  const transitions = new Map<string, TrendTransition[]>();
  for (let date = from; !date.isAfter(to); date = date.addDays(1)) {
    for (const now of at(date).readings) {
      const of = (day: CalendarDate) => at(day).readings.find((r) => r.key === now.key) as TrendReading;
      const log = logs.get(now.key) ?? [];
      const step = nextTrendTransition({
        log,
        asOf: now,
        dayBefore: of(date.addDays(-1)),
        twoDaysBefore: of(date.addDays(-2)),
        resolutionIsGoodNews: signal.resolutionIsGoodNews,
      });
      if (step.append !== undefined) logs.set(now.key, [...log, step.append]);
      transitions.set(now.key, [...(transitions.get(now.key) ?? []), step.transition]);
    }
  }
  return transitions;
}

describe('MM-605 scenarios', () => {
  it('a step is a dated shift, not a drift', () => {
    const evaluation = evaluateSignal(trendSignal(), stepped, yesterday, 30);
    const level = reading(evaluation, 'level');
    expect(level.status).toBe('detected');
    expect(level.finding).toMatchObject({ detector: 'shift', direction: 'up' });
    expect(Math.abs(level.finding!.onsetDate!.daysUntil(stepAt))).toBeLessThanOrEqual(2);
    expect(level.finding!.effect).toBeGreaterThanOrEqual(100);
    expect(evaluation.findings.some((f) => f.aspect === 'drift')).toBe(false);
  });

  it('a logging-style switch is not an eating change', () => {
    const switched: TrendBoundary[] = [{ date: stepAt.addDays(1), cause: 'loggingStyle' }];
    const evaluation = evaluateSignal(trendSignal(), stepped, yesterday, 30, switched);
    const quality = evaluation.findings.filter((f) => f.aspect === 'loggingStyle');
    expect(quality).toHaveLength(1);
    expect(quality[0]).toMatchObject({ priority: 'dataQuality', direction: 'up', key: 'kcal:loggingStyle' });
    expect(evaluation.findings.some((f) => f.aspect === 'level')).toBe(false);
  });

  it('missing data does not resolve: the finding is held', () => {
    // 40 steady days, 10 days 300 higher, then nothing logged for 10 days.
    const series = trendDays(
      first,
      Array.from({ length: 60 }, (_, i) => (i < 40 ? wobble(2000, i) : i < 50 ? wobble(2300, i) : undefined)),
    );
    const transitions = runMachine(trendSignal(), series, first.addDays(46), yesterday);
    const level = transitions.get('kcal:level') ?? [];
    expect(level).toContain('new');
    expect(level[level.length - 1]).toBe('held');
    expect([...transitions.values()].flat()).not.toContain('resolved');
  });

  it('back-fill does not flicker: new needs two evaluations', () => {
    // Three low days, then yesterday half logged: a short run would end on it.
    const values = (yesterdayValue: number) =>
      Array.from({ length: 46 }, (_, i) => (i < 40 ? wobble(2000, i) : i < 43 ? 1890 : i === 43 ? yesterdayValue : wobble(2000, i)));
    const start = yesterday.addDays(-43);
    const halfLogged = trendDays(start, values(1000));
    const signal = trendSignal();
    const at = (series: readonly TrendDay[], date: CalendarDate) => reading(evaluateSignal(signal, series, date, 30), 'level');

    const asOf = at(halfLogged, yesterday);
    expect(asOf.status).toBe('detected');
    const morning = nextTrendTransition({
      log: [],
      asOf,
      dayBefore: at(halfLogged, yesterday.addDays(-1)),
      twoDaysBefore: at(halfLogged, yesterday.addDays(-2)),
      resolutionIsGoodNews: true,
    });
    expect(morning).toMatchObject({ transition: 'none', append: undefined, announced: false });

    // Completed the next morning: the run no longer holds, and nothing is said the day after either.
    const completed = trendDays(start, values(2000));
    const next = nextTrendTransition({
      log: [],
      asOf: at(completed, yesterday.addDays(1)),
      dayBefore: at(completed, yesterday),
      twoDaysBefore: at(completed, yesterday.addDays(-1)),
      resolutionIsGoodNews: true,
    });
    expect(next.transition).toBe('none');
  });

  it('a target change starts a new span for level against target', () => {
    const raised = CalendarDate.of(2026, 10, 10);
    const protein = trendSignal({
      id: 'protein',
      unit: 'g',
      delta: 10,
      sigmaFloor: 1,
      roundTo: 1,
      aspects: ['level'],
      detectors: ['levelAgainstTarget'],
    });
    const series = trendDays(first, Array.from({ length: 60 }, (_, i) => wobble(150, i, 5)), (_, date) => ({
      target: date.isBefore(raised) ? 120 : 170,
    }));
    const evaluation = evaluateSignal(protein, series, yesterday, 30, [{ date: raised, cause: 'targets' }]);
    const level = reading(evaluation, 'level');
    expect(evaluation.regimeStart).toBe(raised);
    expect(level.finding).toMatchObject({ detector: 'levelAgainstTarget', direction: 'down', n: 11, k: 11, onsetDate: raised });
  });

  it('edits do not re-announce: the figures update and nothing is appended', () => {
    const signal = trendSignal();
    const announcedOn = yesterday.addDays(-4);
    const before = reading(evaluateSignal(signal, stepped, announcedOn, 30), 'level');
    expect(before.status).toBe('detected');
    const log: TrendAnnouncement[] = [
      {
        key: before.key,
        transition: 'new',
        on: announcedOn,
        direction: before.finding!.direction,
        onsetDate: before.finding!.onsetDate,
        figures: {
          effect: before.finding!.effect,
          unit: before.finding!.unit,
          n: before.finding!.n,
          k: before.finding!.k,
          span: 30,
          coverage: before.finding!.coverage,
        },
        tier: before.finding!.tier,
        rulesVersion: 1,
      },
    ];
    // An entry five days ago is edited up.
    const edited = stepped.map((d) => (d.date === yesterday.addDays(-5) ? { ...d, value: (d.value as number) + 40 } : d));
    const at = (date: CalendarDate) => reading(evaluateSignal(signal, edited, date, 30), 'level');
    const step = nextTrendTransition({
      log,
      asOf: at(yesterday),
      dayBefore: at(yesterday.addDays(-1)),
      twoDaysBefore: at(yesterday.addDays(-2)),
      resolutionIsGoodNews: true,
      rulesVersion: 2,
    });
    expect(step).toMatchObject({ transition: 'continuing', append: undefined, announced: false });
  });

  it('rounding never says zero: an effect that rounds below δ is no finding', () => {
    const signal = trendSignal({ delta: 10, roundTo: 25, sigmaFloor: 1, aspects: ['level'], detectors: ['levelAgainstTarget'] });
    for (const value of [111, 89]) {
      const series = trendDays(first, Array(60).fill(value), () => ({ target: 100 }));
      const evaluation = evaluateSignal(signal, series, yesterday, 30);
      expect(evaluation.findings).toEqual([]);
      for (const r of evaluation.readings) expect(r.finding === undefined || !Object.is(r.finding.effect, -0)).toBe(true);
    }
  });

  it('today is never read', () => {
    const today = yesterday.addDays(1);
    const withToday = [...stepped, { date: today, value: 9000, eligible: true, reason: undefined } satisfies TrendDay];
    for (const span of [7, 14, 30, 90] as const) {
      expect(evaluateSignal(trendSignal(), withToday, yesterday, span)).toEqual(evaluateSignal(trendSignal(), stepped, yesterday, span));
    }
  });

  it('coverage under 60% holds every key, and 60–80% drops a tier and says "on the days you logged"', () => {
    const sparse = stepped.map((d, i) => (i % 2 === 0 ? { ...d, value: undefined, eligible: false, reason: 'unlogged' as const } : d));
    const held = evaluateSignal(trendSignal(), sparse, yesterday, 30);
    expect(held.readings.every((r) => r.status === 'held')).toBe(true);
    expect(held.findings).toEqual([]);

    // Three days in ten unlogged: 70% coverage.
    const thinned = stepped.map((d, i) => (i % 10 === 1 || i % 10 === 4 || i % 10 === 7 ? { ...d, value: undefined, eligible: false, reason: 'unlogged' as const } : d));
    const evaluation = evaluateSignal(trendSignal(), thinned, yesterday, 30);
    expect(evaluation.coverage).toBeCloseTo(0.7, 6);
    for (const r of evaluation.readings) {
      if (r.finding !== undefined) expect(r.finding).toMatchObject({ onLoggedDays: true, tier: expect.stringMatching(/silent|clear/) });
    }
  });

  it('a detector whose minimum the span cannot meet does not run', () => {
    // On 7 days neither the drift, the day of week nor recent against baseline can run: those keys are held.
    const evaluation = evaluateSignal(trendSignal(), stepped, yesterday, 7);
    expect(reading(evaluation, 'drift').status).toBe('held');
    expect(reading(evaluation, 'weekday').status).toBe('held');
  });
});
