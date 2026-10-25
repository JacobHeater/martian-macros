const values = ['level', 'drift', 'weekday', 'loggingStyle'] as const;

/**
 * What a finding is about, and with the signal its key (MM-605): the level
 * (D1, D3, D4, D6), a drift (D2), a day of the week (D5), or a change that
 * sits on a logging-style switch, which is data quality and not an eating
 * change.
 */
export type TrendAspect = (typeof values)[number];

export const TrendAspect = { values } as const;
