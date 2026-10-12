const values = [
  /** Too few whole days of food in the month to measure it. */
  'tooFewFoodDays',
  /** Enough food, but the coach did not settle on an estimate in the month. */
  'notSettled',
] as const;

/** Why a monthly report has no expenditure estimate (MM-33). */
export type ReportEstimateGap = (typeof values)[number];

export const ReportEstimateGap = { values } as const;
