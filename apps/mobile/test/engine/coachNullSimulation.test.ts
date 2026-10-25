import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { analyseTrainingSpan } from '../../src/engine/analysis/analyseTrainingSpan';
import { analyseFoodSpan } from '../../src/engine/analysis/food/analyseFoodSpan';
import type { TrendSpan } from '../../src/engine/trends/TrendSpan';
import { stationaryCoachUser } from './support/stationaryCoachUser';

/**
 * MM-605's false-alarm budget over every signal together (MM-606's food
 * signals and MM-609's training, water and sleep signals): people whose
 * eating and training do not change, analysed on successive days as the
 * Coach tab would for 2w and 1m. Every fix that appears where the
 * evaluation the day before had none is a false "new" finding; the budget
 * is at most one per person per 30 days, for each span. The trend core's
 * own simulation is `trendNullSimulation.test.ts`.
 *
 * Counted before MM-605's state machine, which needs two evaluations in a
 * row for "new", so this is the stricter count.
 */
const start = CalendarDate.of(2026, 1, 5);
const days = 150;
/** The first day evaluated: a 1m span and its 28-day baseline, and T2's 6 weeks, lie behind it. */
const firstEvaluated = 60;
const users = 60;

describe('the coach null simulation', () => {
  it.each([14, 30] as const)(
    'stationary users see at most one new fix per 30 days over every signal, span %i',
    (span: TrendSpan) => {
      let newFixes = 0;
      let comparisons = 0;
      let withFindings = 0;
      for (let user = 0; user < users; user++) {
        const person = stationaryCoachUser(7000 + user, start, days);
        let before: ReadonlySet<string> | undefined;
        for (let i = firstEvaluated; i < days; i++) {
          const asOf = start.addDays(i);
          const findings = [...analyseFoodSpan(person.food, span, asOf), ...analyseTrainingSpan(person.training(asOf), span, asOf)];
          if (findings.length > 0) withFindings += 1;
          const fixes = new Set(findings.filter((f) => f.kind === 'fix').map((f) => `${f.signal}|${f.id}`));
          if (before !== undefined) {
            for (const id of fixes) if (!before.has(id)) newFixes += 1;
            comparisons += 1;
          }
          before = fixes;
        }
      }
      // The analysis ran: a steady person has things holding up.
      expect(withFindings).toBeGreaterThan(0);
      const perUserPer30Days = (newFixes / users) * (30 / (comparisons / users));
      expect(perUserPer30Days).toBeLessThanOrEqual(1);
    },
    300_000,
  );
});
