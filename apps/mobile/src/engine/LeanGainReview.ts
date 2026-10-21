import type { CalendarDate } from '../domain/CalendarDate';
import type { LeanGainStopReason } from './LeanGainStopReason';

interface LeanGainReviewInit {
  startedOn: CalendarDate;
  days: number;
  intendedFraction: number;
  gainFraction?: number | undefined;
  gainingFast?: boolean;
  weightChangeKg?: number | undefined;
  waistChangeCm?: number | undefined;
  waistEntries?: number;
  fatHeavy?: boolean;
  stop?: LeanGainStopReason | undefined;
  bodyFatPercent: number;
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
  readonly bodyFatPercent: number;

  /** The waist's rise as a share of where it began, when it rose beyond its noise. */
  readonly waistRiseFraction: number | undefined;

  /** Weight up over weeks of surplus with no judged lift higher. Changes no calories. */
  readonly strengthFlat: boolean;
  readonly liftsJudged: number;

  constructor(init: LeanGainReviewInit) {
    this.startedOn = init.startedOn;
    this.days = init.days;
    this.intendedFraction = init.intendedFraction;
    this.gainFraction = init.gainFraction;
    this.gainingFast = init.gainingFast ?? false;
    this.weightChangeKg = init.weightChangeKg;
    this.waistChangeCm = init.waistChangeCm;
    this.waistEntries = init.waistEntries ?? 0;
    this.fatHeavy = init.fatHeavy ?? false;
    this.stop = init.stop;
    this.bodyFatPercent = init.bodyFatPercent;
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
}
