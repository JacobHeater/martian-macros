const relativeSigmas = {
  weighed: 0.05,
  labelServing: 0.1,
  householdMeasure: 0.15,
  palm: 0.25,
  cuppedHand: 0.3,
  thumb: 0.4,
  quickAdd: 0.4,
} as const;

/**
 * How a logged quantity was measured. Every food entry carries one so the
 * engine knows how much to trust the day's intake total.
 */
export type QuantitySource = keyof typeof relativeSigmas;

export const QuantitySource = {
  values: Object.keys(relativeSigmas) as readonly QuantitySource[],

  /** One-sigma relative error of the energy in an entry measured this way. */
  relativeSigma(source: QuantitySource): number {
    return relativeSigmas[source];
  },
} as const;
