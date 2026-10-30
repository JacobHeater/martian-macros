/**
 * When the rest of the day is tight (MM-713), chosen without asking and
 * marked so in the ticket. The owner's breakfast of 2026-10-30, 243 kcal
 * for 5 g, left the rest of the day needing 38% protein against a 34%
 * target, and the brief called that a squeeze. Tight is lean-protein-only
 * territory, not a few points over the plan.
 */
export const RunwayRule = {
  /** The rest of the day is tight when it must be over this share protein... */
  tightDensity: 0.5,
  /** ...or over the day's own target density by this much, whichever is higher. */
  tightOverTarget: 0.15,
} as const;
