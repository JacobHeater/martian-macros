import { binomialCriticalCount } from './binomialCriticalCount';
import { medianOf } from './medianOf';
import type { TrendDetection } from './TrendDetection';
import type { TrendDirection } from './TrendDirection';
import type { TrendPoint } from './TrendPoint';
import { TrendRule } from './TrendRule';

/**
 * D1, level against target (MM-605): a one-sided sign test over the current
 * regime's eligible days that have a target. It fires one way when the days
 * off target that way reach k_crit(n) at α 0.05 and the median deviation is
 * at least δ that way. Days exactly on target are left out of n. Undefined
 * under 7 days.
 */
export function detectLevelAgainstTarget(points: readonly TrendPoint[], delta: number): TrendDetection[] | undefined {
  const rule = TrendRule.levelAgainstTarget;
  const deviations = points.flatMap((p) => (p.target === undefined ? [] : [p.value - p.target])).filter((d) => d !== 0);
  const n = deviations.length;
  if (n < rule.minimumDays) return undefined;
  const critical = binomialCriticalCount(n, rule.alpha);
  const strongCritical = binomialCriticalCount(n, rule.strongAlpha);
  const median = medianOf(deviations);
  const onset = points.find((p) => p.target !== undefined)?.date;
  const toward = (direction: TrendDirection): TrendDetection => {
    const k = deviations.filter((d) => (direction === 'up' ? d > 0 : d < 0)).length;
    const effectToward = direction === 'up' ? median : -median;
    return {
      detector: 'levelAgainstTarget',
      direction,
      fires: k >= critical && effectToward >= delta,
      strong: k >= strongCritical,
      ratio: k / critical,
      effect: median,
      n,
      k,
      days: n,
      onset,
    };
  };
  return [toward('up'), toward('down')];
}
