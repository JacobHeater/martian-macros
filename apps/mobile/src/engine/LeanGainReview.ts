import type { CalendarDate } from '../domain/CalendarDate';
import type { LeanGainStopReason } from './LeanGainStopReason';

interface LeanGainReviewInit {
  startedOn: CalendarDate;
  days: number;
  intendedFraction: number;
  slowerPace?: boolean;
  gainFraction?: number | undefined;
  gainingFast?: boolean;
  weightChangeKg?: number | undefined;
  waistChangeCm?: number | undefined;
  waistEntries?: number;
  fatHeavy?: boolean;
  stop?: LeanGainStopReason | undefined;
  bodyFatPercent: number;
  bodyFatFromRange?: boolean;
  waistRiseFraction?: number | undefined;
  strengthFlat?: boolean;
  liftsJudged?: number;
}

/**
 * What the coach says about a running lean gain (MM-129): too fast, fat-heavy,
 * time to stop, or weight up with strength flat. Each is advice; none of
 * them changes a target.
 */
export class LeanGainReview {
  /** The first day of the unbroken stretch on lean gain, and how many days ago. */
  readonly startedOn: CalendarDate;
  readonly days: number;

  /** The pace the targets in force aim for, a share of body weight a week. */
  readonly intendedFraction: number;

  /** The targets in force are on the slower gain the user chose (MM-480). */
  readonly slowerPace: boolean;

  /** The trend's pace over the last three weeks, when it can be read. */
  readonly gainFraction: number | undefined;
  readonly gainingFast: boolean;

  /** Trend weight and waist over the stretch, when both ends are known. */
  readonly weightChangeKg: number | undefined;
  readonly waistChangeCm: number | undefined;
  readonly waistEntries: number;

  /** The waist rose beyond its noise by more than the rule's centimeters per kilogram. */
  readonly fatHeavy: boolean;

  /** Why ending the gain is recommended, or undefined. */
  readonly stop: LeanGainStopReason | undefined;
  /**
   * The body fat the stop line was read against: the upper end of the range,
   * or the user's own figure (`bodyFatFromRange` false).
   */
  readonly bodyFatPercent: number;
  readonly bodyFatFromRange: boolean;

  /** The waist's rise as a share of where it began, when it rose beyond its noise. */
  readonly waistRiseFraction: number | undefined;

  /** Weight up over weeks of surplus with no judged lift higher. Changes no calories. */
  readonly strengthFlat: boolean;
  readonly liftsJudged: number;

  constructor(init: LeanGainReviewInit) {
    this.startedOn = init.startedOn;
    this.days = init.days;
    this.intendedFraction = init.intendedFraction;
    this.slowerPace = init.slowerPace ?? false;
    this.gainFraction = init.gainFraction;
    this.gainingFast = init.gainingFast ?? false;
    this.weightChangeKg = init.weightChangeKg;
    this.waistChangeCm = init.waistChangeCm;
    this.waistEntries = init.waistEntries ?? 0;
    this.fatHeavy = init.fatHeavy ?? false;
    this.stop = init.stop;
    this.bodyFatPercent = init.bodyFatPercent;
    this.bodyFatFromRange = init.bodyFatFromRange ?? false;
    this.waistRiseFraction = init.waistRiseFraction;
    this.strengthFlat = init.strengthFlat ?? false;
    this.liftsJudged = init.liftsJudged ?? 0;
  }

  /** Whole weeks on lean gain. */
  get weeks(): number {
    return Math.trunc(this.days / 7);
  }

  /** Something to say: the card shows only then. */
  get anything(): boolean {
    return this.gainingFast || this.fatHeavy || this.stop !== undefined || this.strengthFlat;
  }

  /** A slower gain or maintenance is offered: the gain looks fat-heavy, or it is time to end it. */
  get offersGoalChange(): boolean {
    return this.fatHeavy || this.stop !== undefined;
  }

  /**
   * The slower gain is offered beside maintenance (MM-480): the gain looks
   * fat-heavy, it is not yet time to end it, and it is not already slower.
   */
  get offersSlowerGain(): boolean {
    return this.fatHeavy && this.stop === undefined && !this.slowerPace;
  }
}
