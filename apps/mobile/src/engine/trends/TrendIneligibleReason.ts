const values = ['unlogged', 'partial', 'excluded'] as const;

/**
 * Why a day of a trend series does not count (MM-605). Unlogged is never
 * zero; a partial day counts for no intake signal, ratios included; a
 * signal may exclude a day for a reason of its own.
 */
export type TrendIneligibleReason = (typeof values)[number];

export const TrendIneligibleReason = { values } as const;
