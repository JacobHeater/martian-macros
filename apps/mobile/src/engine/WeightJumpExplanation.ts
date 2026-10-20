import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightJumpCause } from './WeightJumpCause';

interface WeightJumpExplanationInit {
  date: CalendarDate;
  readingKg: number;
  trendKg: number;
  thresholdKg: number;
  causes: readonly WeightJumpCause[];
  fatKcal: number;
}

/**
 * Why a weigh-in is probably far from the trend (MM-142): the reading, the
 * trend it is measured against, how far off counts, up to three likely
 * causes from the log (none when nothing in it explains the jump), and the
 * arithmetic that says what it would have taken for the difference to be
 * fat.
 */
export class WeightJumpExplanation {
  readonly date: CalendarDate;
  readonly readingKg: number;
  readonly trendKg: number;

  /** How far from the trend a reading has to be before it is explained. */
  readonly thresholdKg: number;

  /** The most likely first; empty when nothing in the log explains it. */
  readonly causes: readonly WeightJumpCause[];

  /**
   * The energy, above or below expenditure, it would have taken for the
   * whole difference to be fat gained or lost.
   */
  readonly fatKcal: number;

  constructor(init: WeightJumpExplanationInit) {
    this.date = init.date;
    this.readingKg = init.readingKg;
    this.trendKg = init.trendKg;
    this.thresholdKg = init.thresholdKg;
    this.causes = init.causes;
    this.fatKcal = init.fatKcal;
  }

  /** The reading less the trend: above zero is a reading above it. */
  get deviationKg(): number {
    return this.readingKg - this.trendKg;
  }

  get above(): boolean {
    return this.deviationKg > 0;
  }

  /** The calories cause, when yesterday's intake was outside its target band. */
  get calories(): WeightJumpCause | undefined {
    return this.causes.find((cause) => cause.kind === 'calories');
  }
}
