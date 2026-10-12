/**
 * One lift across a report's month (MM-33): its smoothed estimated
 * one-rep max at the first and the last session of the month.
 */
export interface ReportLift {
  readonly name: string;

  /** Sessions in the month that gave an estimate. */
  readonly sessions: number;
  readonly fromKg: number;
  readonly toKg: number;
}
