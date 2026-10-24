import { runEndingNear } from './runEndingNear';
import type { TrendDay } from './TrendDay';
import type { TrendDetection } from './TrendDetection';
import type { TrendDirection } from './TrendDirection';
import { TrendRule } from './TrendRule';

const mean = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * D4a, a long run (MM-605): at least 7 eligible days, each at least δ on
 * one side of its target, ending yesterday or the day before. `days` is the
 * span, one entry per calendar day, ascending. Undefined when no day of the
 * span has a target.
 */
export function detectLongRun(days: readonly TrendDay[], delta: number): TrendDetection[] | undefined {
  if (!days.some((d) => d.target !== undefined)) return undefined;
  const minimum = TrendRule.longRun.minimumDays;
  const toward = (direction: TrendDirection): TrendDetection => {
    const sign = direction === 'up' ? 1 : -1;
    const run = runEndingNear(days, (p) => p.target !== undefined && sign * (p.value - p.target) >= delta);
    const length = run?.points.length ?? 0;
    return {
      detector: 'longRun',
      direction,
      fires: length >= minimum,
      strong: length >= TrendRule.run.strongDays,
      ratio: length / minimum,
      effect: run === undefined ? 0 : mean(run.points.map((p) => p.value - (p.target as number))),
      n: length,
      k: length,
      days: length,
      onset: run?.start.date,
    };
  };
  return [toward('up'), toward('down')];
}
