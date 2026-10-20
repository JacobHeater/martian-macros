/**
 * The diet-break policy (MM-135, the product owner's decision of
 * 2026-10-13 on MM-31's forced week): a break is offered after twelve
 * unbroken weeks of deficit and whenever the recovery signals fail
 * (MM-117), and planned by the app only at twenty, as a safety floor. Each
 * figure is a row in the evidence register; tune them here.
 */
export const DietBreakRule = {
  /** From this many whole weeks of unbroken deficit the coach offers a break. */
  offerFromWeeks: 12,

  /** At this many the app plans one itself, offer or no offer. */
  forceFromWeeks: 20,

  /** How long a break is, chosen or planned: weeks at maintenance. */
  breakWeeks: 2,

  /**
   * Targets at or above maintenance in force for this many consecutive
   * days end the unbroken deficit, however they came about: a break, a
   * maintenance week, a change of goal. A shorter stretch does not.
   */
  resetDays: 7,
} as const;
