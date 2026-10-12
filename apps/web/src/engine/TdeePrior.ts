/** A TDEE value with one-sigma uncertainty. */
export interface TdeePrior {
  readonly kcal: number;
  readonly sigmaKcal: number;
}
