import { nextTrendTransition } from '../trends/nextTrendTransition';
import type { TrendAnnouncement } from '../trends/TrendAnnouncement';
import type { TrendStep } from '../trends/TrendStep';
import { coachTrendReadingOf } from './coachTrendReadingOf';
import type { CoachSpanEvaluation } from './CoachSpanEvaluation';

/**
 * Each announcement-log key's step for one day (MM-605's state machine,
 * `nextTrendTransition`), from the coach's analysis of one span as of E
 * (yesterday), E−1 and E−2. The keys are every fix and data-quality
 * finding said on any of the three days, and every key the log still
 * follows (its last entry is not resolved).
 *
 * Idempotent against the log: a key that already has an entry made for E
 * (or later) is not stepped again, so evaluating a day twice appends
 * nothing the second time. Resolution is good news for a fix, whose
 * holding-up line may then say so; not for a data-quality finding.
 */
export function coachTrendSteps({
  log,
  asOf,
  dayBefore,
  twoDaysBefore,
}: {
  /** The whole announcement log, oldest first. */
  log: readonly TrendAnnouncement[];
  asOf: CoachSpanEvaluation;
  dayBefore: CoachSpanEvaluation;
  twoDaysBefore: CoachSpanEvaluation;
}): ReadonlyMap<string, TrendStep> {
  const e = asOf.asOf;
  const byKey = new Map<string, TrendAnnouncement[]>();
  for (const entry of log) {
    const entries = byKey.get(entry.key);
    if (entries === undefined) byKey.set(entry.key, [entry]);
    else entries.push(entry);
  }
  const keys = new Set<string>();
  for (const evaluation of [asOf, dayBefore, twoDaysBefore]) {
    for (const f of evaluation.findings) if (f.kind === 'fix' || f.kind === 'dataQuality') keys.add(f.id);
  }
  for (const [key, entries] of byKey) {
    if (entries[entries.length - 1]?.transition !== 'resolved') keys.add(key);
  }
  const steps = new Map<string, TrendStep>();
  for (const key of keys) {
    const entries = byKey.get(key) ?? [];
    if (entries.some((entry) => !entry.on.isBefore(e))) continue;
    steps.set(
      key,
      nextTrendTransition({
        log: entries,
        asOf: coachTrendReadingOf(key, asOf),
        dayBefore: coachTrendReadingOf(key, dayBefore),
        twoDaysBefore: coachTrendReadingOf(key, twoDaysBefore),
        resolutionIsGoodNews: !key.endsWith(':dataQuality'),
      }),
    );
  }
  return steps;
}
