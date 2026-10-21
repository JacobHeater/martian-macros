const values = ['weight', 'history'] as const;

/**
 * A gap in what the app may read that weakens an estimate it shows
 * (MM-523): weigh-ins not allowed from the health platform, under the
 * trend and the dates it projects; or the history refused (MM-73), under
 * the expenditure estimate. Each is said once, beside that estimate, until
 * it is dismissed. `snoozeKind` is the kind its dismissal is kept under,
 * with the gap as the subject, quiet for always.
 */
export type DataGap = (typeof values)[number];

export const DataGap = { values, snoozeKind: 'dataGap' } as const;
