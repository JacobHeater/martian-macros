import { binomialCriticalCount } from './binomialCriticalCount';
import { medianOf } from './medianOf';
import type { TrendDay } from './TrendDay';
import type { TrendDetection } from './TrendDetection';
import type { TrendDirection } from './TrendDirection';
import { TrendRule } from './TrendRule';

/**
 * D5, one weekday (MM-605), paired within each week: the day's value minus
 * the median of the week's other eligible days. It fires when 4 or more
 * weeks are all at least max(δ, σ) the same way, or 5 of the last 6. Of the
 * seven days, the one that fires (then the strongest) is kept for each
 * direction. `blocks` are 7-day blocks, most recent first (`weekBlocksOf`).
 * Undefined when no day pairs in 4 weeks.
 */
export function detectWeekday(
  blocks: readonly (readonly TrendDay[])[],
  delta: number,
  sigma: number,
): TrendDetection[] | undefined {
  const rule = TrendRule.weekday;
  const threshold = Math.max(delta, sigma);
  const candidates: TrendDetection[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    const differences: number[] = [];
    let days = 0;
    for (const block of blocks) {
      const eligible = block.filter((d) => d.eligible && d.value !== undefined);
      const day = eligible.find((d) => d.date.weekday === weekday);
      const others = eligible.filter((d) => d !== day).map((d) => d.value as number);
      if (day === undefined || others.length < rule.minimumOtherDays) continue;
      differences.push((day.value as number) - medianOf(others));
      days += eligible.length;
    }
    const n = differences.length;
    if (n < rule.weekdayAllWeeks) continue;
    const effect = medianOf(differences);
    const strongCritical = binomialCriticalCount(n, rule.strongAlpha);
    const onset = blocks[blocks.length - 1]?.[0]?.date;
    for (const direction of ['up', 'down'] as const) {
      const sign = direction === 'up' ? 1 : -1;
      const agrees = differences.map((d) => sign * d >= threshold);
      const all = agrees.every(Boolean);
      const recent = agrees.slice(0, rule.weekdayMostOf).filter(Boolean).length;
      const most = n >= rule.weekdayMostOf && recent >= rule.weekdayMost;
      const k = n >= rule.weekdayMostOf ? recent : agrees.filter(Boolean).length;
      const required = n >= rule.weekdayMostOf ? rule.weekdayMost : n;
      candidates.push({
        detector: 'weekday',
        direction,
        fires: all || most,
        strong: agrees.filter(Boolean).length >= strongCritical,
        ratio: all ? Math.max(1, k / required) : k / required,
        effect,
        n,
        k: all ? n : k,
        days,
        onset,
        weekday,
      });
    }
  }
  if (candidates.length === 0) return undefined;
  const best = (direction: TrendDirection) =>
    candidates
      .filter((c) => c.direction === direction)
      .sort((a, b) => Number(b.fires) - Number(a.fires) || b.ratio - a.ratio || Math.abs(b.effect) - Math.abs(a.effect))[0] as TrendDetection;
  return [best('up'), best('down')];
}
