import { clamp } from '../../lang/clamp';
import { medianOf } from './medianOf';
import { TrendRule } from './TrendRule';
import { twoSampleShift } from './twoSampleShift';

/**
 * The most likely change point of `values` (MM-605, D3): the split, with at
 * least 7 values before and 5 after, whose difference in means over its
 * standard error is largest. The scan is one pass over prefix sums of the
 * values winsorised at ±3σ about their median; the split's own figures are
 * `twoSampleShift`'s, on the values as they are. Undefined when there are
 * too few values.
 */
export function bestSplitOf(
  values: readonly number[],
  floor: number,
): { readonly at: number; readonly difference: number; readonly t: number } | undefined {
  const { minimumBefore, minimumAfter, winsorSigmas } = TrendRule.shift;
  const n = values.length;
  if (n < minimumBefore + minimumAfter) return undefined;
  const center = medianOf(values);
  const sigma = Math.max(TrendRule.sigmaScale * medianOf(values.map((v) => Math.abs(v - center))), floor);
  const prefix = [0];
  for (const v of values) prefix.push((prefix[prefix.length - 1] as number) + clamp(v, center - winsorSigmas * sigma, center + winsorSigmas * sigma));
  const total = prefix[n] as number;
  let best = minimumBefore;
  let bestScore = -1;
  for (let k = minimumBefore; k <= n - minimumAfter; k++) {
    const before = (prefix[k] as number) / k;
    const after = (total - (prefix[k] as number)) / (n - k);
    const score = Math.abs(after - before) / Math.sqrt(1 / k + 1 / (n - k));
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  const { difference, t } = twoSampleShift(values.slice(0, best), values.slice(best), floor);
  return { at: best, difference, t };
}
