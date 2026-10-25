const values = ['silent', 'clear', 'strong'] as const;

/**
 * How strongly a finding is put (MM-605): silent is not said, clear reads
 * "most days" and "lately", strong reads "nearly every day" and "since".
 */
export type TrendTier = (typeof values)[number];

export const TrendTier = {
  values,

  /** The tier's rank: 0 is silent, 2 is strong. */
  rank(tier: TrendTier): number {
    return values.indexOf(tier);
  },
} as const;
