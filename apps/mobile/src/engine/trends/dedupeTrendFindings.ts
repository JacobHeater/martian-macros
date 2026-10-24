import { TrendRule } from './TrendRule';
import type { TrendFinding } from './TrendFinding';
import { TrendTier } from './TrendTier';

const strength = (f: TrendFinding) => Math.min(Math.abs(f.effect) / f.delta, TrendRule.maxEffectMultiple);

/** Stronger first: tier, then effect against δ, then the most recent onset, then catalog order. */
const stronger = (a: TrendFinding, b: TrendFinding) =>
  TrendTier.rank(b.tier) - TrendTier.rank(a.tier) ||
  strength(b) - strength(a) ||
  (b.onsetDate?.epochDay ?? -Infinity) - (a.onsetDate?.epochDay ?? -Infinity) ||
  a.order - b.order;

/**
 * De-duplicates findings across signals (MM-605), after each signal's own
 * keys (one finding per key, `evaluateSignal`):
 *
 * - a shift beats a drift on the same signal, which it carries as support;
 * - correlated signals (one `family`) keep their top finding per span, aspect and
 *   direction, with the others attached as supporting figures;
 * - a data-quality finding withholds the size of the claims of its signal
 *   and family over the same span.
 */
export function dedupeTrendFindings(findings: readonly TrendFinding[]): TrendFinding[] {
  // A shift beats a drift.
  const shifts = new Map<string, TrendFinding>(
    findings.filter((f) => f.aspect === 'level' && f.detector === 'shift' && !f.settled).map((f) => [`${f.signal}|${f.span}`, f] as const),
  );
  const beaten = new Map<TrendFinding, TrendFinding[]>();
  let kept = findings.filter((f) => {
    const shift = shifts.get(`${f.signal}|${f.span}`);
    if (f.aspect !== 'drift' || shift === undefined) return true;
    beaten.set(shift, [...(beaten.get(shift) ?? []), f]);
    return false;
  });
  kept = kept.map((f) => (beaten.has(f) ? { ...f, supporting: [...f.supporting, ...(beaten.get(f) ?? [])] } : f));

  // One per family, span, aspect and direction.
  const groups = new Map<string, TrendFinding[]>();
  for (const f of kept) {
    if (f.family === undefined || f.priority === 'dataQuality') continue;
    const group = `${f.family}|${f.span}|${f.aspect}|${f.direction}`;
    groups.set(group, [...(groups.get(group) ?? []), f]);
  }
  const absorbed = new Set<TrendFinding>();
  const carried = new Map<TrendFinding, TrendFinding[]>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [top, ...rest] = [...group].sort(stronger) as [TrendFinding, ...TrendFinding[]];
    carried.set(top, rest);
    for (const f of rest) absorbed.add(f);
  }
  kept = kept.filter((f) => !absorbed.has(f)).map((f) => (carried.has(f) ? { ...f, supporting: [...f.supporting, ...(carried.get(f) ?? [])] } : f));

  // Data quality withholds sizes.
  const quality = kept.filter((f) => f.priority === 'dataQuality');
  return kept.map((f) => {
    if (f.priority === 'dataQuality' || f.sizeWithheld) return f;
    const limited = quality.some((q) => q.span === f.span && (q.signal === f.signal || (q.family !== undefined && q.family === f.family)));
    return limited ? { ...f, sizeWithheld: true } : f;
  });
}
