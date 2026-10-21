import { clamp } from '../lang/clamp';
import { BodyFatEstimate } from './BodyFatEstimate';

/**
 * Two body-fat estimates of the same person, combined by how reliable
 * each is, allowing for errors that go together (`correlation`, -1 to 1):
 * the minimum-variance weighting of two correlated estimates (MM-34).
 *
 * The weight stays between 0 and 1, so the result always lies between the
 * two, and with correlated errors it is never as narrow as independent
 * errors would make it.
 */
export function combineBodyFatEstimates(a: BodyFatEstimate, b: BodyFatEstimate, correlation: number): BodyFatEstimate {
  const va = a.sigmaPercent * a.sigmaPercent;
  const vb = b.sigmaPercent * b.sigmaPercent;
  const cov = correlation * a.sigmaPercent * b.sigmaPercent;
  const denominator = va + vb - 2 * cov;
  const w = denominator <= 0 ? 0.5 : clamp((vb - cov) / denominator, 0, 1);
  const variance = w * w * va + (1 - w) * (1 - w) * vb + 2 * w * (1 - w) * cov;
  return new BodyFatEstimate({
    percent: w * a.percent + (1 - w) * b.percent,
    sigmaPercent: Math.sqrt(Math.max(variance, 0)),
  });
}
