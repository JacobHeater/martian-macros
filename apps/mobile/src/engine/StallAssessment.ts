import type { StallDiagnosis } from './StallDiagnosis';
import type { StallNotAssessedReason } from './StallNotAssessedReason';
import type { StallStatus } from './StallStatus';

interface StallAssessmentInit {
  status: StallStatus;
  windowDays: number;
  notAssessedReason?: StallNotAssessedReason | undefined;
  diagnosis?: StallDiagnosis | undefined;
  gaining?: boolean;
  usableFoodDays?: number;
  weighIns?: number;
  slopeKgPerWeek?: number | undefined;
  intendedKgPerWeek?: number | undefined;
  averageIntakeKcal?: number | undefined;
  averageTargetKcal?: number | undefined;
  waistChangeCm?: number | undefined;
  maskedByEvent?: boolean;
  maskedByTraining?: boolean;
  expectedChangeKcal?: number | undefined;
  atFloor?: boolean;
  estimateLow?: boolean;
  shortSleepAverageMinutes?: number | undefined;
  shortSleepNights?: number | undefined;
}

/**
 * The outcome of the stall diagnosis with the figures it rests on (MM-140),
 * so the user can be shown the same account the coach used.
 */
export class StallAssessment {
  readonly status: StallStatus;
  readonly windowDays: number;
  readonly notAssessedReason: StallNotAssessedReason | undefined;
  readonly diagnosis: StallDiagnosis | undefined;

  /** The goal is to gain, so the mirror wording applies. */
  readonly gaining: boolean;
  readonly usableFoodDays: number;
  readonly weighIns: number;
  readonly slopeKgPerWeek: number | undefined;
  readonly intendedKgPerWeek: number | undefined;

  /**
   * The window's average intake on whole days and average target: the same
   * figures the adherence summary gives for the period.
   */
  readonly averageIntakeKcal: number | undefined;
  readonly averageTargetKcal: number | undefined;

  /** Change in waist over the window (negative is down), when measured. */
  readonly waistChangeCm: number | undefined;

  /** A passing weight event falls in the last days of the window. */
  readonly maskedByEvent: boolean;

  /** Training started, or started again after a month off, in the last days of the window. */
  readonly maskedByTraining: boolean;

  /**
   * The change to the calorie target expected at the next check-in under
   * the estimate diagnosis (negative is a reduction); undefined when none.
   */
  readonly expectedChangeKcal: number | undefined;

  /** The target is already at the calorie floor, so it cannot come down. */
  readonly atFloor: boolean;

  /** The estimate is low enough that food is often missing from the log. */
  readonly estimateLow: boolean;

  /**
   * Sleep averaged short over the window (MM-252): the average in minutes
   * and the nights it rests on, said before anything about the log. Undefined
   * when it did not, or no nights were recorded.
   */
  readonly shortSleepAverageMinutes: number | undefined;
  readonly shortSleepNights: number;

  constructor(init: StallAssessmentInit) {
    this.status = init.status;
    this.windowDays = init.windowDays;
    this.notAssessedReason = init.notAssessedReason;
    this.diagnosis = init.diagnosis;
    this.gaining = init.gaining ?? false;
    this.usableFoodDays = init.usableFoodDays ?? 0;
    this.weighIns = init.weighIns ?? 0;
    this.slopeKgPerWeek = init.slopeKgPerWeek;
    this.intendedKgPerWeek = init.intendedKgPerWeek;
    this.averageIntakeKcal = init.averageIntakeKcal;
    this.averageTargetKcal = init.averageTargetKcal;
    this.waistChangeCm = init.waistChangeCm;
    this.maskedByEvent = init.maskedByEvent ?? false;
    this.maskedByTraining = init.maskedByTraining ?? false;
    this.expectedChangeKcal = init.expectedChangeKcal;
    this.atFloor = init.atFloor ?? false;
    this.estimateLow = init.estimateLow ?? false;
    this.shortSleepAverageMinutes = init.shortSleepAverageMinutes;
    this.shortSleepNights = init.shortSleepNights ?? 0;
  }

  static notAssessed(reason: StallNotAssessedReason, { windowDays }: { windowDays: number }): StallAssessment {
    return new StallAssessment({ status: 'notAssessed', windowDays, notAssessedReason: reason });
  }
}
