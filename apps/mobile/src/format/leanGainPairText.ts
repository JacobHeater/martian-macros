import type { LeanGainPairSignal } from '../engine/LeanGainPairSignal';

/**
 * What limbs and waist together are consistent with in a lean gain
 * (MM-156): said as consistent with, never as a measurement of tissue.
 */
export function leanGainPairText(signal: LeanGainPairSignal): string {
  switch (signal) {
    case 'limbsUpWaistSteady':
      return 'Limbs up while the waist held is consistent with the gain going as planned. A tape cannot tell what grew.';
    case 'waistUpLimbsSteady':
      return 'The waist up while the limbs held is consistent with the gain putting on more fat than planned.';
  }
}
