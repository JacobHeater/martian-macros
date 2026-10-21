import type { BiologicalSex } from '../domain/BiologicalSex';
import { SafetyBounds } from './SafetyBounds';

/**
 * What a shaped day may not go under (MM-122, MM-124): the calorie floor
 * (MM-28) and the fat minimum for the day's calories, for this person now.
 */
export class TargetShapeLimits {
  readonly floorKcal: number;
  readonly sex: BiologicalSex;
  readonly trendWeightKg: number;
  readonly heightCm: number;

  constructor(init: { floorKcal: number; sex: BiologicalSex; trendWeightKg: number; heightCm: number }) {
    this.floorKcal = init.floorKcal;
    this.sex = init.sex;
    this.trendWeightKg = init.trendWeightKg;
    this.heightCm = init.heightCm;
  }

  /** `SafetyBounds.minFatG` at `kcal`. */
  fatMinimumG(kcal: number): number {
    return SafetyBounds.minFatG({ sex: this.sex, weightKg: this.trendWeightKg, heightCm: this.heightCm, kcal });
  }
}
