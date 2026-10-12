import type { CalendarDate } from '../domain/CalendarDate';

interface WeightTrendPointInit {
  date: CalendarDate;
  levelKg: number;
  slopeKgPerDay: number;
  waterKg: number;
  levelVariance: number;
  slopeVariance: number;
  observed: boolean;
  rejected: boolean;
}

/** Smoothed body-weight state for one calendar day. */
export class WeightTrendPoint {
  readonly date: CalendarDate;

  /** Tissue weight with transient water removed. */
  readonly levelKg: number;

  /** Rate of change of `levelKg`. */
  readonly slopeKgPerDay: number;

  /** Estimated transient water/gut-content offset on this day. */
  readonly waterKg: number;

  readonly levelVariance: number;
  readonly slopeVariance: number;

  /** Whether a weigh-in was used on this day. */
  readonly observed: boolean;

  /**
   * Whether a weigh-in on this day was discarded as an outlier
   * (typically a unit mix-up or someone else stepping on the scale).
   */
  readonly rejected: boolean;

  constructor(init: WeightTrendPointInit) {
    this.date = init.date;
    this.levelKg = init.levelKg;
    this.slopeKgPerDay = init.slopeKgPerDay;
    this.waterKg = init.waterKg;
    this.levelVariance = init.levelVariance;
    this.slopeVariance = init.slopeVariance;
    this.observed = init.observed;
    this.rejected = init.rejected;
  }

  get levelSigmaKg(): number {
    return Math.sqrt(this.levelVariance);
  }
}
