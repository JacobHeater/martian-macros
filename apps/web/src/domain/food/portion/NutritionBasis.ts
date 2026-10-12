const values = [
  /**
   * The user typed the totals for everything eaten. Any quantity is only a
   * description and is never multiplied in.
   */
  'enteredTotals',
  /** Reference nutrition scaled by the amount eaten, once, when logged. */
  'calculated',
] as const;

/**
 * Whether an entry's totals were worked out by the app or typed by the user
 * (MM-167). A quantity scales only calculated totals.
 */
export type NutritionBasis = (typeof values)[number];

export const NutritionBasis = { values } as const;
