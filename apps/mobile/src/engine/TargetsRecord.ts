import type { CalendarDate } from '../domain/CalendarDate';
import type { GoalMode } from '../domain/GoalMode';
import { currentTargetRulesVersion } from './currentTargetRulesVersion';
import type { DailyTargets } from './DailyTargets';
import type { TargetsExplanation } from './TargetsExplanation';
import type { TdeeStatus } from './TdeeStatus';

interface TargetsRecordInit {
  effectiveFrom: CalendarDate;
  targets: DailyTargets;
  mode: GoalMode;
  tdeeKcal: number;
  tdeeSigmaKcal: number;
  tdeeStatus: TdeeStatus;
  safetyBodyFatPercent?: number | undefined;
  profileRevision?: number;
  targetRulesVersion?: number;
  explanation?: TargetsExplanation | undefined;
  summarySeen?: boolean;
  requestedLossFraction?: number | undefined;
}

/** Targets in force from `effectiveFrom`, with the TDEE they were based on. */
export class TargetsRecord {
  readonly effectiveFrom: CalendarDate;
  readonly targets: DailyTargets;
  readonly mode: GoalMode;
  readonly tdeeKcal: number;
  readonly tdeeSigmaKcal: number;
  readonly tdeeStatus: TdeeStatus;

  /**
   * The body-fat figure the safety thresholds were applied to when these
   * targets were made (`safetyBodyFatPercent`). The next check-in starts
   * from it, so a rule does not flip on a small move. Undefined on records
   * made before MM-132.
   */
  readonly safetyBodyFatPercent: number | undefined;

  /**
   * The `UserSetup.profileRevision` these targets were made for. A setup
   * with a different revision (sex, date of birth, height or health check
   * corrected, MM-83) gets new targets at once.
   */
  readonly profileRevision: number;

  /** The target-calculation rules used to issue these targets. */
  readonly targetRulesVersion: number;

  /**
   * Why these targets were issued (MM-138). Undefined on records made
   * before explanations were kept.
   */
  readonly explanation: TargetsExplanation | undefined;

  /**
   * Whether the target-change summary has been shown on app open. New engine
   * check-ins mark their records unread; existing/imported records default
   * to seen so they do not produce a backlog of dialogs.
   */
  readonly summarySeen: boolean;

  /**
   * The fat-loss pace these targets were asked for, as the setup held it
   * (MM-128); undefined for the default pace, or on records made before it
   * was kept. A setup asking for another pace gets new targets at once.
   */
  readonly requestedLossFraction: number | undefined;

  constructor(init: TargetsRecordInit) {
    this.effectiveFrom = init.effectiveFrom;
    this.targets = init.targets;
    this.mode = init.mode;
    this.tdeeKcal = init.tdeeKcal;
    this.tdeeSigmaKcal = init.tdeeSigmaKcal;
    this.tdeeStatus = init.tdeeStatus;
    this.safetyBodyFatPercent = init.safetyBodyFatPercent;
    this.requestedLossFraction = init.requestedLossFraction;
    this.profileRevision = init.profileRevision ?? 0;
    this.targetRulesVersion = init.targetRulesVersion ?? currentTargetRulesVersion;
    this.explanation = init.explanation;
    this.summarySeen = init.summarySeen ?? true;
  }

  copyWith({ summarySeen }: { summarySeen?: boolean }): TargetsRecord {
    return new TargetsRecord({
      effectiveFrom: this.effectiveFrom,
      targets: this.targets,
      mode: this.mode,
      tdeeKcal: this.tdeeKcal,
      tdeeSigmaKcal: this.tdeeSigmaKcal,
      tdeeStatus: this.tdeeStatus,
      safetyBodyFatPercent: this.safetyBodyFatPercent,
      profileRevision: this.profileRevision,
      targetRulesVersion: this.targetRulesVersion,
      explanation: this.explanation,
      summarySeen: summarySeen ?? this.summarySeen,
    });
  }
}
