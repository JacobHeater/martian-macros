import { medianOf } from './medianOf';
import { TrendRule } from './TrendRule';

/**
 * The robust spread of two or more segments taken together (MM-605): 1.4826
 * × the median absolute deviation of each value from its own segment's
 * median, so a step between the segments does not widen it. At least
 * `floor`.
 */
export function pooledSigma(segments: readonly (readonly number[])[], floor: number): number {
  const deviations = segments.flatMap((segment) => {
    const center = medianOf(segment);
    return segment.map((v) => Math.abs(v - center));
  });
  const mad = medianOf(deviations);
  return Math.max(TrendRule.sigmaScale * (Number.isNaN(mad) ? 0 : mad), floor);
}
