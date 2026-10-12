import type { TargetFlag } from './TargetFlag';

interface DailyTargetsInit {
  kcal: number;
  proteinG: number;
  proteinMinimumG?: number | undefined;
  fatG: number;
  carbsG: number;
  weeklyRateFraction: number;
  flags?: ReadonlySet<TargetFlag>;
}

export class DailyTargets {
  readonly kcal: number;
  readonly proteinG: number;
  readonly proteinMinimumG: number | undefined;
  readonly fatG: number;
  readonly carbsG: number;

  /**
   * Intended body-weight change per week as a fraction of body weight
   * (negative = loss).
   */
  readonly weeklyRateFraction: number;
  readonly flags: ReadonlySet<TargetFlag>;

  constructor(init: DailyTargetsInit) {
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.proteinMinimumG = init.proteinMinimumG;
    this.fatG = init.fatG;
    this.carbsG = init.carbsG;
    this.weeklyRateFraction = init.weeklyRateFraction;
    this.flags = init.flags ?? new Set();
  }

  meetsProteinMinimum(intakeProteinG: number): boolean {
    const minimum = this.proteinMinimumG;
    return minimum !== undefined && intakeProteinG >= minimum;
  }
}
