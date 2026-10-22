const values = ['limbsUpWaistSteady', 'waistUpLimbsSteady'] as const;

/**
 * What limbs and waist together are consistent with in a lean gain
 * (MM-156): limbs up beyond noise with the waist steady supports the gain;
 * the waist up with the limbs steady supports the fat-heavy notice
 * (MM-129). A pattern, never a measurement of tissue.
 */
export type LeanGainPairSignal = (typeof values)[number];

export const LeanGainPairSignal = { values } as const;
