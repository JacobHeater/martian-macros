/**
 * What the safeguards leave of the food analysis (MM-606, MM-612), read
 * once from `InsightSafeguards` and the coaching policy's cautions.
 */
export interface FoodLimits {
  /** Bariatric surgery: nothing at all. */
  readonly nothing: boolean;
  /** Under 18, or coaching paused: on a span only adds (protein, fiber); on 1d nothing. */
  readonly minorOrPaused: boolean;
  /** The under-eating finding holds (MM-114): nothing about composition, nothing that lowers intake; adds may show. */
  readonly underEating: boolean;
  /** An eating-disorder history: protein lines only (N1–N3), and no food named. */
  readonly proteinOnly: boolean;
  /** Pregnancy, breastfeeding, underweight or low body weight: no fat, density or calorie-lowering line. */
  readonly noLowering: boolean;
  /** Kidney disease: protein is a cap, so no line for more protein. */
  readonly noMoreProtein: boolean;
  /** Insulin or a sulfonylurea: no line that lowers carbohydrate. */
  readonly noCarbLowering: boolean;
}
