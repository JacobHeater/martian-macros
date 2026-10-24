import { medianOf } from './medianOf';
import type { TrendPoint } from './TrendPoint';

/**
 * The least spread a signal's σ may be (MM-605): the larger of the signal's
 * own floor and the median of each day's measurement uncertainty
 * (`relativeSigma` × value), so a very regular logger does not fire on
 * trivial changes.
 */
export function spreadFloorOf(points: readonly TrendPoint[], sigmaFloor: number): number {
  const measured = medianOf(points.map((p) => (p.relativeSigma ?? 0) * Math.abs(p.value)));
  return Math.max(sigmaFloor, Number.isNaN(measured) ? 0 : measured);
}
