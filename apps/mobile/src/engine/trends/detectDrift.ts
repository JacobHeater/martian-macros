import type { CalendarDate } from '../../domain/CalendarDate';
import { mannKendallZ } from './mannKendallZ';
import { theilSenSlope } from './theilSenSlope';
import type { TrendDetection } from './TrendDetection';
import type { TrendDirection } from './TrendDirection';
import type { TrendPoint } from './TrendPoint';
import { TrendRule } from './TrendRule';

/**
 * D2, drift (MM-605): the Theil–Sen slope over the current regime with
 * Mann–Kendall's |Z| at least 2.33 (n shrunk by lag-1 autocorrelation), and
 * the slope over the regime's days at least δ. Undefined unless the regime
 * is 21 days or more with 12 eligible days, 3 in each third.
 */
export function detectDrift(
  points: readonly TrendPoint[],
  regimeStart: CalendarDate,
  asOf: CalendarDate,
  delta: number,
): TrendDetection[] | undefined {
  const rule = TrendRule.drift;
  const regimeDays = regimeStart.daysUntil(asOf) + 1;
  if (regimeDays < rule.minimumRegimeDays || points.length < rule.minimumDays) return undefined;
  const thirds = [0, 0, 0];
  for (const p of points) {
    const third = Math.min(2, Math.floor((3 * regimeStart.daysUntil(p.date)) / regimeDays));
    thirds[third] = (thirds[third] as number) + 1;
  }
  if (thirds.some((count) => count < rule.minimumPerThird)) return undefined;
  const slope = theilSenSlope(points);
  const z = mannKendallZ(points, slope);
  const effect = slope * regimeDays;
  const toward = (direction: TrendDirection): TrendDetection => {
    const zToward = direction === 'up' ? z : -z;
    const effectToward = direction === 'up' ? effect : -effect;
    return {
      detector: 'drift',
      direction,
      fires: zToward >= rule.z && effectToward >= delta,
      strong: zToward >= rule.strongZ,
      ratio: Math.max(0, zToward) / rule.z,
      effect,
      n: points.length,
      k: points.length,
      days: points.length,
      onset: points[0]?.date,
    };
  };
  return [toward('up'), toward('down')];
}
