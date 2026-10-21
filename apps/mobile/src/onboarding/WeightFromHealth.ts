/**
 * The health platform's part in onboarding's weight question (MM-68,
 * MM-73): reading weight from it is offered, and today's weigh-in from it
 * is offered as the current weight.
 */
export interface WeightFromHealth {
  /** Health Connect or Apple Health. */
  readonly platform: string;
  /** Whether reading weight is allowed (on an iPhone, asked for). */
  readonly allowed: boolean;
  /** Whether the platform is being read just now. */
  readonly reading: boolean;
  /** Today's imported weigh-in, as the platform's day rule chose it (MM-71), and where it came from. */
  readonly today?: { readonly kg: number; readonly sourceName: string } | undefined;
  /** Whether the weight in the field is today's imported weigh-in, put there with `onUse`. */
  readonly used: boolean;
  /**
   * Counts the times the weight field is to take focus: the offer's row
   * that was pressed goes away, so the field is where a reader goes on.
   */
  readonly focusWeight: number;
  /** Asks to read weight, with its history, and reads it. */
  readonly onAllow: () => void;
  /** Puts today's imported weigh-in in the field. */
  readonly onUse: () => void;
}
