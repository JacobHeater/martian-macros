/**
 * The goals the user switched on in Settings (MM-311, MM-313). Each is
 * undefined while switched off, which is how a new installation starts.
 */
export class NutritionGoals {
  /** Suggested when the sodium limit is first switched on: the DGA's CDRR for adults. */
  static readonly suggestedSodiumLimitMg = 2_300;
  static readonly minSodiumLimitMg = 500;
  static readonly maxSodiumLimitMg = 6_000;

  /** Suggested when the water goal is first switched on. */
  static readonly suggestedWaterGoalMl = 2_000;
  static readonly minWaterGoalMl = 500;
  static readonly maxWaterGoalMl = 6_000;

  static readonly none = new NutritionGoals({});

  /** A daily upper limit, in milligrams. */
  readonly sodiumLimitMg: number | undefined;

  /** A daily amount to drink, in millilitres. */
  readonly waterGoalMl: number | undefined;

  constructor(init: { sodiumLimitMg?: number | undefined; waterGoalMl?: number | undefined }) {
    this.sodiumLimitMg = init.sodiumLimitMg;
    this.waterGoalMl = init.waterGoalMl;
  }

  static sodiumLimitAllowed(mg: number): boolean {
    return Number.isInteger(mg) && mg >= NutritionGoals.minSodiumLimitMg && mg <= NutritionGoals.maxSodiumLimitMg;
  }

  static waterGoalAllowed(ml: number): boolean {
    return ml >= NutritionGoals.minWaterGoalMl && ml <= NutritionGoals.maxWaterGoalMl;
  }
}
