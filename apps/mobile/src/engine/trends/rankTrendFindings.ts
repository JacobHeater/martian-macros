import { InsightPriority } from '../InsightPriority';
import type { TrendFinding } from './TrendFinding';
import { TrendRule } from './TrendRule';
import { TrendTier } from './TrendTier';
import { TrendTransition } from './TrendTransition';

const strength = (f: TrendFinding) => Math.min(Math.abs(f.effect) / f.delta, TrendRule.maxEffectMultiple);

/**
 * Findings in the order they are shown (MM-605), compared in turn by:
 * priority class (safety, data quality, coaching, pattern, education); the
 * key's transition (reversed, new, resolved, continuing; a key missing from
 * `transitions` counts as continuing); actionable first; tier; the effect
 * against δ, capped at 3; the most recent onset; catalog order. The key
 * breaks any tie left, so the order is stable. Filters (MM-141) run before.
 */
export function rankTrendFindings(
  findings: readonly TrendFinding[],
  transitions: ReadonlyMap<string, TrendTransition> = new Map(),
): TrendFinding[] {
  const transitionRank = (f: TrendFinding) => TrendTransition.rank(transitions.get(f.key) ?? 'continuing');
  return [...findings].sort(
    (a, b) =>
      InsightPriority.index(a.priority) - InsightPriority.index(b.priority) ||
      transitionRank(a) - transitionRank(b) ||
      Number(b.actionable) - Number(a.actionable) ||
      TrendTier.rank(b.tier) - TrendTier.rank(a.tier) ||
      strength(b) - strength(a) ||
      (b.onsetDate?.epochDay ?? -Infinity) - (a.onsetDate?.epochDay ?? -Infinity) ||
      a.order - b.order ||
      (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );
}
