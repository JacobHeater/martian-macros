import type { EstimatedBodyFat } from './EstimatedBodyFat';

/**
 * The month's body-fat range from the user's measurements (MM-450), each
 * end as it stood on its day, so a later entry does not change an old
 * report. Only a range that rests on the waist (`basis` `waist`) is here:
 * the formula's guess alone, or the user's own figure, is not a range
 * that settled from measurements.
 */
export interface ReportBodyFat {
  /** The range at the end of the month. */
  readonly end: EstimatedBodyFat;

  /**
   * The range when the month began (at the end of the day before, where
   * the report before ended), when one had settled by then. Undefined
   * otherwise, and always with an eating-disorder history: the report
   * shows no change in body fat then.
   */
  readonly start: EstimatedBodyFat | undefined;
}
