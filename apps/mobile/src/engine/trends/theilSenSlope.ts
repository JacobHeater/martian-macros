import { medianOf } from './medianOf';
import type { TrendPoint } from './TrendPoint';

/**
 * The Theil–Sen slope of `points` per day (MM-605, D2): the median of the
 * slopes between every pair of days. O(n²), at most about 4,000 pairs.
 */
export function theilSenSlope(points: readonly TrendPoint[]): number {
  const slopes: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i] as TrendPoint;
    for (let j = i + 1; j < points.length; j++) {
      const b = points[j] as TrendPoint;
      const days = b.date.epochDay - a.date.epochDay;
      if (days !== 0) slopes.push((b.value - a.value) / days);
    }
  }
  const slope = medianOf(slopes);
  return Number.isNaN(slope) ? 0 : slope;
}
