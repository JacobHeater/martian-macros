import { medianOf } from './medianOf';
import { spreadFloorOf } from './spreadFloorOf';
import type { TrendPoint } from './TrendPoint';
import { TrendRule } from './TrendRule';

/**
 * The robust spread of `points` (MM-605): σ = 1.4826 × the median absolute
 * deviation from their median, floored by `spreadFloorOf`.
 */
export function robustSigma(points: readonly TrendPoint[], sigmaFloor: number): number {
  const values = points.map((p) => p.value);
  const center = medianOf(values);
  const mad = medianOf(values.map((v) => Math.abs(v - center)));
  return Math.max(TrendRule.sigmaScale * (Number.isNaN(mad) ? 0 : mad), spreadFloorOf(points, sigmaFloor));
}
