import type { LeanGainPairSignal } from './LeanGainPairSignal';
import type { LimbFact } from './LimbFact';

/**
 * How far past its threshold a single limb's rise must go to count alone
 * (MM-156): with several limbs measured, one of them past its threshold is
 * one chance in several to see noise, so one limb alone needs half as much
 * again. Judgement.
 */
const singleLimbFactor = 1.5;

/**
 * The lean gain's reading of limbs and waist together (MM-156), or
 * undefined when they say nothing together: no limb measured at both ends,
 * no waist, or a mix that fits neither pattern. Limbs are up when two or
 * more are, or when one is up by `singleLimbFactor` times its threshold.
 */
export function leanGainPairOf(facts: readonly LimbFact[]): LeanGainPairSignal | undefined {
  const waist = facts.find((fact) => fact.waist !== undefined)?.waist;
  if (waist === undefined || facts.length === 0) return undefined;
  const up = facts.filter((fact) => fact.limb.direction === 'up');
  const anyUp = up.length >= 2 || up.some((fact) => fact.limb.changeCm >= singleLimbFactor * fact.limb.thresholdCm - 1e-9);
  const allSteady = facts.every((fact) => fact.limb.direction === 'noClearChange');
  if (anyUp && waist.direction === 'noClearChange') return 'limbsUpWaistSteady';
  if (allSteady && waist.direction === 'up') return 'waistUpLimbsSteady';
  return undefined;
}
