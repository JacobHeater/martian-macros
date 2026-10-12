import type { CalendarDate } from './CalendarDate';
import type { DayCompleteness } from './DayCompleteness';

interface IntakeDayInit {
  date: CalendarDate;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  completeness?: DayCompleteness;
  relativeSigma?: number;
  weighedShare?: number;
  estimatedShare?: number;
}

/** Aggregated intake for one calendar day. */
export class IntakeDay {
  readonly date: CalendarDate;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly completeness: DayCompleteness;

  /**
   * Combined measurement uncertainty of the day's energy total; see
   * `dailyRelativeSigma`.
   */
  readonly relativeSigma: number;

  /**
   * Fraction of the day's energy logged as weighed entries (0–1). A sudden
   * change signals a logging-style switch and so a shift in logging bias.
   */
  readonly weighedShare: number;

  /**
   * Fraction of the day's energy from estimated entries (0–1), which limits
   * what an average can be trusted for (MM-150).
   */
  readonly estimatedShare: number;

  constructor(init: IntakeDayInit) {
    this.date = init.date;
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.carbsG = init.carbsG;
    this.fatG = init.fatG;
    this.completeness = init.completeness ?? 'unmarked';
    this.relativeSigma = init.relativeSigma ?? 0.1;
    this.weighedShare = init.weighedShare ?? 0;
    this.estimatedShare = init.estimatedShare ?? 0;
  }
}
