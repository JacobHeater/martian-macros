import { clamp } from '../../lang/clamp';
import { medianOf } from './medianOf';
import { pooledSigma } from './pooledSigma';
import { TrendRule } from './TrendRule';

const mean = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * The change from `before` to `after` and its statistic (MM-605, D3 and D6):
 * the difference in means over its standard error. σ is pooled robustly
 * around each segment's median, at least `floor`, and each segment is
 * winsorised at ±3σ about its own median first, so one odd day does not
 * make a change and a real step is not clipped.
 */
export function twoSampleShift(
  before: readonly number[],
  after: readonly number[],
  floor: number,
): { readonly difference: number; readonly t: number } {
  const sigma = pooledSigma([before, after], floor);
  const limit = TrendRule.shift.winsorSigmas * sigma;
  const winsorised = (segment: readonly number[]) => {
    const center = medianOf(segment);
    return segment.map((v) => clamp(v, center - limit, center + limit));
  };
  const difference = mean(winsorised(after)) - mean(winsorised(before));
  const error = sigma * Math.sqrt(1 / before.length + 1 / after.length);
  if (error <= 0) return { difference, t: difference === 0 ? 0 : Number.POSITIVE_INFINITY };
  return { difference, t: Math.abs(difference) / error };
}
