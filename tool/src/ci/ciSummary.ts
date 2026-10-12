import type { CheckObservation } from './checkObservation.ts';
import type { CheckState } from './checkState.ts';

/**
 * The checks of one commit taken together. It says what CI reported, not
 * whether the pull request may be merged. `none` is no checks observed (not
 * the same as passed); `pending` has none failed; `blocked` waits on a
 * person; `cancelled` includes stale; `passed` needs at least one pass;
 * `inconclusive` finished with none passing (all skipped or neutral).
 */
export type CiSummary = 'none' | 'pending' | 'failed' | 'blocked' | 'cancelled' | 'passed' | 'inconclusive' | 'unknown';

/**
 * Sums up `checks`. The worst state wins; skipped and neutral checks never
 * make a pass by themselves.
 */
export function summarizeChecks(checks: Iterable<CheckObservation>): CiSummary {
  const states = new Set<CheckState>();
  for (const check of checks) states.add(check.state);
  if (states.size === 0) return 'none';
  const any = (...of: CheckState[]) => of.some((state) => states.has(state));
  if (any('failed', 'timedOut')) return 'failed';
  if (any('actionRequired')) return 'blocked';
  if (any('cancelled', 'stale')) return 'cancelled';
  if (any('pending', 'running')) return 'pending';
  if (any('unknown')) return 'unknown';
  if (any('passed')) return 'passed';
  return 'inconclusive';
}
