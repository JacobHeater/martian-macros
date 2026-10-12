/** Calories and macros for what was actually eaten. */
export class NutritionTotals {
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;

  constructor(init: { kcal: number; proteinG: number; carbsG: number; fatG: number }) {
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.carbsG = init.carbsG;
    this.fatG = init.fatG;
  }

  times(factor: number): NutritionTotals {
    return new NutritionTotals({
      kcal: this.kcal * factor,
      proteinG: this.proteinG * factor,
      carbsG: this.carbsG * factor,
      fatG: this.fatG * factor,
    });
  }
}
