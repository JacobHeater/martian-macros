/** The water goal in force (MM-358): an amount, and whether it is the one suggested or the person's own. */
export interface WaterGoal {
  readonly ml: number;
  readonly suggested: boolean;
}
