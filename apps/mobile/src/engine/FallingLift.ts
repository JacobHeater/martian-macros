/** A lift whose smoothed estimated max (MM-77) has fallen far enough to count toward the offer to ease a deficit (MM-117). */
export interface FallingLift {
  readonly exerciseId: string;

  /** The exercise's name, as the strength trend says it. */
  readonly name: string;

  /** The smoothed estimate at the start of the window and at the latest session. */
  readonly fromKg: number;
  readonly toKg: number;

  /** Sessions on distinct days within the window. */
  readonly sessions: number;
}
