/**
 * What the person's answers and state allow of inline insights (MM-362),
 * whatever the switches say.
 */
export interface InsightSafeguards {
  /** Under 18, no inline insight is shown anywhere. */
  readonly adult: boolean;
  /** No insight about weight or food composition (MM-141's limit). */
  readonly eatingDisorderHistory: boolean;
  /** No insight mentions weight (MM-118). */
  readonly weightHidden: boolean;
  /** While coaching is paused, no inline insight is shown (MM-148). */
  readonly paused: boolean;
}
