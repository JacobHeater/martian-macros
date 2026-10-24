/** A food named in a finding's evidence (MM-606's N11): its share of the total or gap, and the days it was eaten. */
export interface CoachFood {
  readonly name: string;
  /** Share of the finding's total or gap, 0 to 1. */
  readonly share: number;
  readonly days: number;
  readonly kcal: number;
}
