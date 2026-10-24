import type { CalendarDate } from '../../domain/CalendarDate';
import { spreadFloorOf } from './spreadFloorOf';
import type { TrendDetection } from './TrendDetection';
import type { TrendDirection } from './TrendDirection';
import type { TrendPoint } from './TrendPoint';
import { TrendRule } from './TrendRule';
import { twoSampleShift } from './twoSampleShift';

/**
 * D6, recent against baseline (MM-605): D3's statistic at the fixed split,
 * the last 7 days against the 28 before them, each winsorised at ±3σ
 * (`twoSampleShift`). It fires when the statistic reaches the
 * threshold and the difference is at least δ. Undefined under 5 recent or
 * 14 baseline eligible days. `points` are eligible and ascending.
 */
export function detectRecentAgainstBaseline(
  points: readonly TrendPoint[],
  asOf: CalendarDate,
  sigmaFloor: number,
  delta: number,
): TrendDetection[] | undefined {
  const rule = TrendRule.recentAgainstBaseline;
  const recentFrom = asOf.addDays(1 - rule.recentDays);
  const baselineFrom = recentFrom.addDays(-rule.baselineDays);
  const recent = points.filter((p) => !p.date.isBefore(recentFrom) && !p.date.isAfter(asOf));
  const baseline = points.filter((p) => !p.date.isBefore(baselineFrom) && p.date.isBefore(recentFrom));
  if (recent.length < rule.minimumRecent || baseline.length < rule.minimumBaseline) return undefined;
  const values = (list: readonly TrendPoint[]) => list.map((p) => p.value);
  const { difference, t } = twoSampleShift(values(baseline), values(recent), spreadFloorOf([...baseline, ...recent], sigmaFloor));
  const toward = (direction: TrendDirection): TrendDetection => {
    const agrees = direction === 'up' ? difference > 0 : difference < 0;
    const tToward = agrees ? t : 0;
    return {
      detector: 'recentAgainstBaseline',
      direction,
      fires: tToward >= rule.t && Math.abs(difference) >= delta,
      strong: tToward >= rule.t * rule.strongMultiple,
      ratio: tToward / rule.t,
      effect: difference,
      n: recent.length + baseline.length,
      k: recent.length,
      days: recent.length + baseline.length,
      onset: recent[0]?.date,
    };
  };
  return [toward('up'), toward('down')];
}
