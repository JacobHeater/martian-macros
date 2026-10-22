import type { BiologicalSex } from '../domain/BiologicalSex';
import type { CoachingPolicy } from '../domain/CoachingPolicy';
import type { GoalMode } from '../domain/GoalMode';
import type { LeanGainPace } from '../domain/LeanGainPace';
import type { TrainingStatus } from '../domain/TrainingStatus';
import type { BodyFatEstimate } from './BodyFatEstimate';
import type { BreakFlag } from './BreakFlag';
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
  leanGainPace?: LeanGainPace;
  safetyBodyFatPercent?: number | undefined;
  safetyRaiseKcal?: number;
  breakRequested?: boolean;
  continuingBreak?: BreakFlag | undefined;
  correctionRateFraction?: number | undefined;
  easeFromKcal?: number | undefined;
  trainingLapsed?: boolean;
  stepLimited?: boolean;
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
   * Lean-gain pace chosen by the user (MM-480): the pace training status
   * sets, or `LeanGainRule.slowerPaceFactor` of it. Defaults to the first.
   */
  readonly leanGainPace: LeanGainPace;

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

  /**
   * A diet break the current targets began has not run its length
   * (`breakInForce`, MM-135): this set stays at maintenance and carries the
   * same flag, so targets reissued inside a break do not end it.
   */
  readonly continuingBreak: BreakFlag | undefined;

  /**
   * At maintenance, a temporary pace back toward the anchor after drifting
   * out of the band (MM-130): signed, a share of body weight a week.
   */
  readonly correctionRateFraction: number | undefined;

  /**
   * Leaving a deficit in two steps (MM-130): the calorie target before the
   * change, so this set of targets stops halfway to maintenance.
   */
  readonly easeFromKcal: number | undefined;

  /**
   * On lean gain, training has lapsed (MM-134): no workout for three weeks,
   * or no training days set. The surplus is replaced by maintenance.
   */
  readonly trainingLapsed: boolean;

  /**
   * Whether a change from `previous` keeps the weekly step limit. Off only
   * when the person recalculates (MM-559); a safety raise and the hold
   * after one still apply.
   */
  readonly stepLimited: boolean;

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
    this.leanGainPace = init.leanGainPace ?? 'standard';
    this.safetyBodyFatPercent = init.safetyBodyFatPercent;
    this.safetyRaiseKcal = init.safetyRaiseKcal ?? 0;
    this.correctionRateFraction = init.correctionRateFraction;
    this.easeFromKcal = init.easeFromKcal;
    this.trainingLapsed = init.trainingLapsed ?? false;
    this.breakRequested = init.breakRequested ?? false;
    this.continuingBreak = init.continuingBreak;
    this.stepLimited = init.stepLimited ?? true;
  }
}
