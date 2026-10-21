import type { RecompReview } from './RecompReview';
import type { ReportEstimate } from './ReportEstimate';
import type { ReportEstimateGap } from './ReportEstimateGap';
import type { ReportLift } from './ReportLift';
import type { ReportPeriod } from './ReportPeriod';
import type { ReportPersonalRecord } from './ReportPersonalRecord';
import type { ReportTargetChange } from './ReportTargetChange';
import type { WaistChange } from './WaistChange';

interface MonthlyReportInit {
  period: ReportPeriod;
  daysLogged: number;
  completeDays: number;
  weighIns: number;
  targetChanges: readonly ReportTargetChange[];
  trendChangeKg?: number | undefined;
  intendedChangeKg?: number | undefined;
  averageProteinG?: number | undefined;
  averageProteinTargetG?: number | undefined;
  waistChange?: WaistChange | undefined;
  estimate?: ReportEstimate | undefined;
  estimateGap?: ReportEstimateGap | undefined;
  workouts?: number;
  lifts?: readonly ReportLift[];
  personalRecords?: readonly ReportPersonalRecord[];
  longestRunDays?: number;
  recompReview?: RecompReview | undefined;
}

/**
 * A month of the user's work and what the coach measured from it (MM-33),
 * built from stored history. Facts, never a score.
 */
export class MonthlyReport {
  readonly period: ReportPeriod;

  /**
   * Days with any food logged, and of those the whole days (the same rule
   * as the adherence summary).
   */
  readonly daysLogged: number;
  readonly completeDays: number;
  readonly weighIns: number;

  /**
   * The longest logging streak in the month (MM-92), by the Dashboard
   * streak's rule: whole days in a row, one missed day a week forgiven,
   * paused days skipped. How much was eaten plays no part.
   */
  readonly longestRunDays: number;

  /**
   * Change in trend weight across the month; undefined with fewer than four
   * weigh-ins, which cannot say.
   */
  readonly trendChangeKg: number | undefined;

  /** What the targets in force meant for the month; undefined with none. */
  readonly intendedChangeKg: number | undefined;

  /**
   * Mean protein on whole days, and the mean protein target; undefined when
   * there are no whole days or no targets.
   */
  readonly averageProteinG: number | undefined;
  readonly averageProteinTargetG: number | undefined;

  /**
   * Whether the waist changed over the month, by the one rule every feature
   * uses (MM-155): smoothed ends, judged against the tape's noise. Undefined
   * without a measurement at both ends.
   */
  readonly waistChange: WaistChange | undefined;

  /**
   * The expenditure estimate the month ended on, or undefined with
   * `estimateGap` saying why.
   */
  readonly estimate: ReportEstimate | undefined;
  readonly estimateGap: ReportEstimateGap | undefined;

  /** Finished workouts in the month. */
  readonly workouts: number;

  /**
   * The lifts with at least two sessions in the month that gave an
   * estimate, most trained first. One session cannot show a change.
   */
  readonly lifts: readonly ReportLift[];

  /**
   * The personal records set in the month (MM-92), oldest first: a
   * session that beat every earlier session of its lift, as the strength
   * history stood at the end of the month.
   */
  readonly personalRecords: readonly ReportPersonalRecord[];

  /**
   * The recomp review that fell due in the month, if one did (MM-133),
   * as it stood on the last day of the month it was shown.
   */
  readonly recompReview: RecompReview | undefined;

  /** Every change to the targets in the month, oldest first. */
  readonly targetChanges: readonly ReportTargetChange[];

  constructor(init: MonthlyReportInit) {
    this.period = init.period;
    this.daysLogged = init.daysLogged;
    this.completeDays = init.completeDays;
    this.weighIns = init.weighIns;
    this.targetChanges = init.targetChanges;
    this.trendChangeKg = init.trendChangeKg;
    this.intendedChangeKg = init.intendedChangeKg;
    this.averageProteinG = init.averageProteinG;
    this.averageProteinTargetG = init.averageProteinTargetG;
    this.waistChange = init.waistChange;
    this.estimate = init.estimate;
    this.estimateGap = init.estimateGap;
    this.workouts = init.workouts ?? 0;
    this.lifts = init.lifts ?? [];
    this.personalRecords = init.personalRecords ?? [];
    this.longestRunDays = init.longestRunDays ?? 0;
    this.recompReview = init.recompReview;
  }
}
