import type { BiologicalSex } from '../domain/BiologicalSex';
import type { CoachingPolicy } from '../domain/CoachingPolicy';
import type { GoalMode } from '../domain/GoalMode';
import type { TrainingStatus } from '../domain/TrainingStatus';
import type { BodyFatEstimate } from './BodyFatEstimate';
import type { DailyTargets } from './DailyTargets';

interface TargetInputsInit {
  sex: BiologicalSex;
  heightCm: number;
  trendWeightKg: number;
  bodyFat: BodyFatEstimate;
  mode: GoalMode;
  trainingStatus: TrainingStatus;
  policy: CoachingPolicy;
  tdeeKcal: number;
  bmrKcal: number;
  trainingDaysPerWeek?: number;
  trainingKcalPerDay?: number;
  previous?: DailyTargets | undefined;
  consecutiveDeficitWeeks?: number;
  requestedLossFraction?: number | undefined;
  safetyBodyFatPercent?: number | undefined;
  safetyRaiseKcal?: number;
  breakRequested?: boolean;
}

export class TargetInputs {
  readonly sex: BiologicalSex;
  readonly heightCm: number;
  readonly trendWeightKg: number;
  readonly bodyFat: BodyFatEstimate;
  readonly mode: GoalMode;
  readonly trainingStatus: TrainingStatus;
  readonly policy: CoachingPolicy;

  /** From `TdeeEstimator`, in logging units. */
  readonly tdeeKcal: number;
  readonly bmrKcal: number;
  readonly trainingDaysPerWeek: number;

  /** Estimated from logged training (not wearable active energy). */
  readonly trainingKcalPerDay: number;

  /** Last week's targets, for rate limiting; undefined on the first week. */
  readonly previous: DailyTargets | undefined;
  readonly consecutiveDeficitWeeks: number;

  /**
   * Fat-loss pace chosen by the user (positive fraction per week, e.g.
   * 0.0075). Clamped to the safety maximum. Defaults to 0.75%.
   */
  readonly requestedLossFraction: number | undefined;

  /**
   * The body-fat figure the safety thresholds (loss limit, protein rule,
   * energy-availability floor) are applied to, from `safetyBodyFatPercent`.
   * Undefined: the cautious value of `bodyFat` with no memory of last week.
   */
  readonly safetyBodyFatPercent: number | undefined;

  /**
   * Added to last week's target even beyond the weekly step limit, because
   * the user is losing faster than the safe pace (`lossSafetyRaiseKcal`).
   */
  readonly safetyRaiseKcal: number;

  /**
   * The user chose a maintenance week now (MM-117): a deficit is replaced
   * by maintenance for this set of targets.
   */
  readonly breakRequested: boolean;

  constructor(init: TargetInputsInit) {
    this.sex = init.sex;
    this.heightCm = init.heightCm;
    this.trendWeightKg = init.trendWeightKg;
    this.bodyFat = init.bodyFat;
    this.mode = init.mode;
    this.trainingStatus = init.trainingStatus;
    this.policy = init.policy;
    this.tdeeKcal = init.tdeeKcal;
    this.bmrKcal = init.bmrKcal;
    this.trainingDaysPerWeek = init.trainingDaysPerWeek ?? 0;
    this.trainingKcalPerDay = init.trainingKcalPerDay ?? 0;
    this.previous = init.previous;
    this.consecutiveDeficitWeeks = init.consecutiveDeficitWeeks ?? 0;
    this.requestedLossFraction = init.requestedLossFraction;
    this.safetyBodyFatPercent = init.safetyBodyFatPercent;
    this.safetyRaiseKcal = init.safetyRaiseKcal ?? 0;
    this.breakRequested = init.breakRequested ?? false;
  }
}
