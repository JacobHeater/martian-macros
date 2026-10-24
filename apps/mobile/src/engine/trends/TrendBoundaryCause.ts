const values = ['targets', 'loggingStyle', 'settling'] as const;

/**
 * Why a trend's regime is forced to start on a day (MM-605): new targets
 * (`TargetsRecord.effectiveFrom`), a logging-style switch (`styleSwitchOf`)
 * or the end of a weight settling window.
 */
export type TrendBoundaryCause = (typeof values)[number];

export const TrendBoundaryCause = { values } as const;
