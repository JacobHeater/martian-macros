import type { CalendarDate } from './CalendarDate';
import type { DayCompleteness } from './DayCompleteness';

interface IntakeDayInit {
  date: CalendarDate;
  kcal: number;
  proteinG: number;
  carbsG: number;
  /** Carbohydrate less stated fiber and sugar alcohols (MM-396); the total when not given. */
  netCarbsG?: number;
  fatG: number;
  completeness?: DayCompleteness;
  relativeSigma?: number;
  weighedShare?: number;
  handShare?: number;
  palmProteinShare?: number;
  estimatedShare?: number;
}

/** Aggregated intake for one calendar day. */
export class IntakeDay {
  readonly date: CalendarDate;
  readonly kcal: number;
  readonly proteinG: number;
  /** Total carbohydrate: what the engine and the calories rest on. */
  readonly carbsG: number;
  /**
   * Carbohydrate less the fiber and sugar alcohols stated for each food,
   * each food's net never below zero (MM-396). For what is shown, never for
   * the engine.
   */
  readonly netCarbsG: number;
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
   * Fraction of the day's energy logged by palm, cupped hand or thumb (0–1),
   * so hand portions are a logging style of their own (MM-46).
   */
  readonly handShare: number;

  /**
   * Fraction of the day's protein logged by palm (0–1), for the nudge to
   * weigh the main protein food (MM-46).
   */
  readonly palmProteinShare: number;

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
    this.netCarbsG = init.netCarbsG ?? init.carbsG;
    this.fatG = init.fatG;
    this.completeness = init.completeness ?? 'unmarked';
    this.relativeSigma = init.relativeSigma ?? 0.1;
    this.weighedShare = init.weighedShare ?? 0;
    this.handShare = init.handShare ?? 0;
    this.palmProteinShare = init.palmProteinShare ?? 0;
    this.estimatedShare = init.estimatedShare ?? 0;
  }
}
