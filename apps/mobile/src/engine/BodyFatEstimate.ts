import { clamp } from '../lang/clamp';

/** Body-fat percentage with a one-sigma uncertainty. */
export class BodyFatEstimate {
  readonly percent: number;
  readonly sigmaPercent: number;
  /**
   * The estimate a smart scale's readings were joined to, when they were
   * (MM-502). A scale may only make safety stricter: the safety figures
   * (`fatFreeMassUpperKg`, `cautiousBodyFatPercent`) take the more cautious
   * of this estimate and the joined one, so a scale reading higher than the
   * outside measurements can never loosen a floor or a loss limit.
   */
  readonly withoutScale: BodyFatEstimate | undefined;

  constructor(init: { percent: number; sigmaPercent: number; withoutScale?: BodyFatEstimate | undefined }) {
    this.percent = init.percent;
    this.sigmaPercent = init.sigmaPercent;
    this.withoutScale = init.withoutScale;
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
   * uncertainty can never lower a floor; nor can a scale (MM-502): the
   * larger of this bound and the one without the scale is taken.
   */
  fatFreeMassUpperKg(weightKg: number): number {
    const own = weightKg * (1 - this.lowerPercent / 100);
    return this.withoutScale === undefined ? own : Math.max(own, this.withoutScale.fatFreeMassUpperKg(weightKg));
  }
}
