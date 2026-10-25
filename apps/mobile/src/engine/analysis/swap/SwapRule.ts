/**
 * The figures of the coach's swaps (MM-617) beyond MM-607's trade rules
 * (`TradeRule`) and the coach's orders (`CoachAdviceRule`): chosen without
 * asking. Each has an evidence row (`docs/evidence.md`).
 */
export const SwapRule = {
  /** A swap keeps `CoachAdviceRule.swapProteinKept` of the food's protein only when it has at least this much a time. */
  proteinKeptFromG: 8,
} as const;
