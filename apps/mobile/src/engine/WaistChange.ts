import type { MeasuredChange } from './MeasuredChange';

interface WaistChangeInit {
  direction: MeasuredChange;
  fromCm: number;
  toCm: number;
  thresholdCm: number;
  recentEntries: number;
  baselineEntries: number;
}

/**
 * Whether the waist changed over a period, and the figures behind the
 * answer (MM-155). Every feature that asks gets this one answer.
 */
export class WaistChange {
  /** Down, up, or no clear change: a result, not an absence. */
  readonly direction: MeasuredChange;

  /**
   * The smoothed measurement at each end: the middle value of up to three
   * entries.
   */
  readonly fromCm: number;
  readonly toCm: number;

  /** What the difference had to exceed to be called a change. */
  readonly thresholdCm: number;

  /** How many entries each end was smoothed from. */
  readonly recentEntries: number;
  readonly baselineEntries: number;

  constructor(init: WaistChangeInit) {
    this.direction = init.direction;
    this.fromCm = init.fromCm;
    this.toCm = init.toCm;
    this.thresholdCm = init.thresholdCm;
    this.recentEntries = init.recentEntries;
    this.baselineEntries = init.baselineEntries;
  }

  /** Below zero is smaller. */
  get changeCm(): number {
    return this.toCm - this.fromCm;
  }
}
