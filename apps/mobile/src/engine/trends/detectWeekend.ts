import { binomialCriticalCount } from './binomialCriticalCount';
import { medianOf } from './medianOf';
import type { TrendDay } from './TrendDay';
import type { TrendDetection } from './TrendDetection';
import type { TrendDirection } from './TrendDirection';
import { TrendRule } from './TrendRule';

/**
 * D5, the weekend (MM-605), paired within each week: the mean of the
 * weekend's eligible days minus the median of the week's other eligible
 * days. It fires when 3 or more weeks are all at least δ the same way, or 5
 * or more weeks with 80% agreeing. `blocks` are 7-day blocks, most recent
 * first (`weekBlocksOf`). Undefined under 3 weeks that pair.
 */
export function detectWeekend(blocks: readonly (readonly TrendDay[])[], delta: number): TrendDetection[] | undefined {
  const rule = TrendRule.weekday;
  const differences: number[] = [];
  let days = 0;
  for (const block of blocks) {
    const eligible = block.filter((d) => d.eligible && d.value !== undefined);
    const weekend = eligible.filter((d) => d.date.isWeekend).map((d) => d.value as number);
    const others = eligible.filter((d) => !d.date.isWeekend).map((d) => d.value as number);
    if (weekend.length === 0 || others.length < rule.minimumOtherDays) continue;
    differences.push(weekend.reduce((sum, v) => sum + v, 0) / weekend.length - medianOf(others));
    days += eligible.length;
  }
  const n = differences.length;
  if (n < rule.minimumWeeks) return undefined;
  const effect = medianOf(differences);
  const required = n >= rule.weekendMostWeeks ? Math.ceil(rule.weekendMostShare * n - 1e-9) : n;
  const strongCritical = binomialCriticalCount(n, rule.strongAlpha);
  const onset = blocks[blocks.length - 1]?.[0]?.date;
  const toward = (direction: TrendDirection): TrendDetection => {
    const sign = direction === 'up' ? 1 : -1;
    const k = differences.filter((d) => sign * d >= delta).length;
    return {
      detector: 'weekend',
      direction,
      fires: n >= rule.weekendAllWeeks && k >= required,
      strong: k >= strongCritical,
      ratio: k / required,
      effect,
      n,
      k,
      days,
      onset,
      weekday: 'weekend',
    };
  };
  return [toward('up'), toward('down')];
}
