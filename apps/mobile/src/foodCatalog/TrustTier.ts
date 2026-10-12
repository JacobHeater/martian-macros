const codes = {
  /** From a reference database of analysed foods. */
  reference: 0,
  /** Transcribed from a product label. */
  label: 1,
  /** Crowd-entered or conflicting; the user should check it. */
  checkThis: 2,
} as const;

/**
 * How much a food's numbers can be relied on, in words the app can show.
 * No tier is ever called "verified" (MM-153).
 */
export type TrustTier = keyof typeof codes;

export const TrustTier = {
  values: Object.keys(codes) as readonly TrustTier[],

  /** What the pack stores. */
  code(tier: TrustTier): number {
    return codes[tier];
  },

  /** The tier a pack's code stands for; "check this" for a code not known. */
  fromCode(code: number): TrustTier {
    return (Object.keys(codes) as TrustTier[]).find((tier) => codes[tier] === code) ?? 'checkThis';
  },
} as const;
