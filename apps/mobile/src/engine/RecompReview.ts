import type { GoalMode } from '../domain/GoalMode';
import type { MeasuredChange } from './MeasuredChange';
import type { RecompMeasure } from './RecompMeasure';
import type { RecompVerdict } from './RecompVerdict';

interface RecompReviewInit {
  week: number;
  periodDays: number;
  verdict: RecompVerdict | undefined;
  missing: readonly RecompMeasure[];
  waistMeasurements: number;
  waist?: MeasuredChange | undefined;
  waistChangeCm?: number | undefined;
  strength?: MeasuredChange | undefined;
  liftsUp?: readonly string[];
  liftsDown?: readonly string[];
  weightChangeFraction?: number | undefined;
  nextGoal?: GoalMode | undefined;
}

/**
 * A review of a stretch on recomp (MM-133): a verdict with what it rests
 * on, or what would have to be logged to give one. It is the direction of
 * travel, not a measurement of fat or muscle, and it changes nothing by
 * itself.
 */
export class RecompReview {
  /** Which review this is: 8, 12, then every 8 weeks. */
  readonly week: number;

  /** How many days up to today it looks at. */
  readonly periodDays: number;

  /** Undefined when `missing` is not empty. */
  readonly verdict: RecompVerdict | undefined;

  /** What was not logged enough to give a verdict. */
  readonly missing: readonly RecompMeasure[];
  readonly waistMeasurements: number;
  readonly waist: MeasuredChange | undefined;
  readonly waistChangeCm: number | undefined;

  /** Up, down, or held or mixed. */
  readonly strength: MeasuredChange | undefined;
  readonly liftsUp: readonly string[];
  readonly liftsDown: readonly string[];

  /** Trend weight's change over the period as a fraction of where it began. */
  readonly weightChangeFraction: number | undefined;

  /**
   * The goal to consider instead, for a recomp that is not working or is a
   * slow cut. Undefined when body fat and training point at recomp all the
   * same, where the thing to look at is the training.
   */
  readonly nextGoal: GoalMode | undefined;

  constructor(init: RecompReviewInit) {
    this.week = init.week;
    this.periodDays = init.periodDays;
    this.verdict = init.verdict;
    this.missing = init.missing;
    this.waistMeasurements = init.waistMeasurements;
    this.waist = init.waist;
    this.waistChangeCm = init.waistChangeCm;
    this.strength = init.strength;
    this.liftsUp = init.liftsUp ?? [];
    this.liftsDown = init.liftsDown ?? [];
    this.weightChangeFraction = init.weightChangeFraction;
    this.nextGoal = init.nextGoal;
  }
}
