import { clamp } from '../lang/clamp';

/** Body-fat percentage with a one-sigma uncertainty. */
export class BodyFatEstimate {
  readonly percent: number;
  readonly sigmaPercent: number;

  constructor(init: { percent: number; sigmaPercent: number }) {
    this.percent = init.percent;
    this.sigmaPercent = init.sigmaPercent;
  }

  /** Two-sigma bounds, clamped to a physiologically possible range. */
  get lowerPercent(): number {
    return clamp(this.percent - 2 * this.sigmaPercent, 2, 70);
  }

  get upperPercent(): number {
    return clamp(this.percent + 2 * this.sigmaPercent, 2, 70);
  }

  fatMassKg(weightKg: number): number {
    return (weightKg * this.percent) / 100;
  }

  /**
   * Upper bound of fat-free mass. Safety floors use this so that
   * uncertainty can never lower a floor.
   */
  fatFreeMassUpperKg(weightKg: number): number {
    return weightKg * (1 - this.lowerPercent / 100);
  }
}
