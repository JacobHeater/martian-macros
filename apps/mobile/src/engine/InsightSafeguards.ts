import type { Caution } from '../domain/Caution';

/**
 * What the person's answers and state allow of inline insights (MM-362),
 * whatever the switches say.
 */
export interface InsightSafeguards {
  /** Under 18, no inline insight is shown anywhere. */
  readonly adult: boolean;
  /** No insight about weight, food composition or the body (MM-141's limit). */
  readonly eatingDisorderHistory: boolean;
  /** No insight mentions weight (MM-118). */
  readonly weightHidden: boolean;
  /** While coaching is paused, no inline insight is shown (MM-148). */
  readonly paused: boolean;
  /**
   * The under-eating finding holds (MM-114): the app cannot tell a partial
   * logger from someone restricting, so nothing about composition or
   * portion is said (the panel's SA-4 on MM-365).
   */
  readonly underEating: boolean;
  /** The coaching policy's cautions: a kind can be left out for any of them. */
  readonly cautions: ReadonlySet<Caution>;
}
