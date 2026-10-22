import type { LeanGainPairSignal } from './LeanGainPairSignal';
import type { LimbFact } from './LimbFact';

/**
 * The lean gain's reading of limbs and waist together (MM-156), or
 * undefined when they say nothing together: no limb measured at both ends,
 * no waist, or a mix that fits neither pattern.
 */
export function leanGainPairOf(facts: readonly LimbFact[]): LeanGainPairSignal | undefined {
  const waist = facts.find((fact) => fact.waist !== undefined)?.waist;
  if (waist === undefined || facts.length === 0) return undefined;
  const anyUp = facts.some((fact) => fact.limb.direction === 'up');
  const allSteady = facts.every((fact) => fact.limb.direction === 'noClearChange');
  if (anyUp && waist.direction === 'noClearChange') return 'limbsUpWaistSteady';
  if (allSteady && waist.direction === 'up') return 'waistUpLimbsSteady';
  return undefined;
}
