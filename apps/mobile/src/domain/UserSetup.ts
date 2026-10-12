import type { CalendarDate } from './CalendarDate';
import type { DailyActivity } from './DailyActivity';
import type { GoalMode } from './GoalMode';
import type { Profile } from './Profile';
import type { ScreeningAnswers } from './ScreeningAnswers';
import type { TrainingStatus } from './TrainingStatus';
import type { UnitSystem } from './UnitSystem';

interface UserSetupInit {
  profile: Profile;
  screening: ScreeningAnswers;
  trainingStatus: TrainingStatus;
  trainingDaysPerWeek: number;
  goalMode: GoalMode;
  onboardedOn: CalendarDate;
  dailyActivity?: DailyActivity;
  profileRevision?: number;
  unitSystem?: UnitSystem;
  bodyFatPercent?: number | undefined;
  requestedLossFraction?: number | undefined;
  healthCheckConfirmedOn?: CalendarDate | undefined;
  healthCheckSkipCount?: number;
  creatineStartedOn?: CalendarDate | undefined;
  maintenanceWeekFrom?: CalendarDate | undefined;
  reliefAnsweredOn?: CalendarDate | undefined;
}

/**
 * What `copyWith` may change. A key that is absent keeps the value. The four
 * that can be cleared (`bodyFatPercent`, `requestedLossFraction`,
 * `healthCheckConfirmedOn`, `creatineStartedOn`) are cleared by giving the
 * key with `undefined`.
 */
interface UserSetupChanges {
  profile?: Profile;
  screening?: ScreeningAnswers;
  profileRevision?: number;
  goalMode?: GoalMode;
  unitSystem?: UnitSystem;
  trainingStatus?: TrainingStatus;
  trainingDaysPerWeek?: number;
  dailyActivity?: DailyActivity;
  bodyFatPercent?: number | undefined;
  requestedLossFraction?: number | undefined;
  healthCheckConfirmedOn?: CalendarDate | undefined;
  healthCheckSkipCount?: number;
  creatineStartedOn?: CalendarDate | undefined;
  maintenanceWeekFrom?: CalendarDate;
  reliefAnsweredOn?: CalendarDate;
}

/** Everything the user tells us at onboarding (and may edit later). */
export class UserSetup {
  static readonly healthCheckIntervalDays = 90;

  readonly profile: Profile;
  readonly screening: ScreeningAnswers;
  readonly trainingStatus: TrainingStatus;
  readonly trainingDaysPerWeek: number;

  /** Activity across the day outside workouts (MM-164). */
  readonly dailyActivity: DailyActivity;

  /**
   * Counts corrections to sex, date of birth, height or the health check
   * (MM-83). Targets records remember the revision they were made for; a
   * mismatch makes the engine issue new targets at once.
   */
  readonly profileRevision: number;
  readonly goalMode: GoalMode;

  /** The day coaching started; anchors the calibration week. */
  readonly onboardedOn: CalendarDate;

  readonly unitSystem: UnitSystem;

  /**
   * The user's own body-fat estimate, if they have one. When undefined the
   * engine starts from a formula estimate with wide uncertainty.
   */
  readonly bodyFatPercent: number | undefined;

  /** Chosen fat-loss pace (fraction of body weight per week), if any. */
  readonly requestedLossFraction: number | undefined;

  /** The last day the user confirmed their health answers. */
  readonly healthCheckConfirmedOn: CalendarDate | undefined;

  /** Consecutive skipped re-checks; two pauses deficit coaching. */
  readonly healthCheckSkipCount: number;

  /** When the user started taking creatine, if they currently take it (MM-136). */
  readonly creatineStartedOn: CalendarDate | undefined;

  /** The day the user last chose to take a maintenance week early (MM-117). */
  readonly maintenanceWeekFrom: CalendarDate | undefined;

  /**
   * The day the user last answered the offer to ease a deficit, whatever
   * they chose (MM-117). The offer is not repeated for three weeks.
   */
  readonly reliefAnsweredOn: CalendarDate | undefined;

  constructor(init: UserSetupInit) {
    this.profile = init.profile;
    this.screening = init.screening;
    this.trainingStatus = init.trainingStatus;
    this.trainingDaysPerWeek = init.trainingDaysPerWeek;
    this.goalMode = init.goalMode;
    this.onboardedOn = init.onboardedOn;
    this.dailyActivity = init.dailyActivity ?? 'light';
    this.profileRevision = init.profileRevision ?? 0;
    this.unitSystem = init.unitSystem ?? 'imperial';
    this.bodyFatPercent = init.bodyFatPercent;
    this.requestedLossFraction = init.requestedLossFraction;
    this.healthCheckConfirmedOn = init.healthCheckConfirmedOn;
    this.healthCheckSkipCount = init.healthCheckSkipCount ?? 0;
    this.creatineStartedOn = init.creatineStartedOn;
    this.maintenanceWeekFrom = init.maintenanceWeekFrom;
    this.reliefAnsweredOn = init.reliefAnsweredOn;
  }

  healthCheckDueOn(today: CalendarDate): boolean {
    const confirmed = this.healthCheckConfirmedOn;
    return confirmed === undefined || confirmed.daysUntil(today) >= UserSetup.healthCheckIntervalDays;
  }

  copyWith(changes: UserSetupChanges): UserSetup {
    return new UserSetup({
      profile: changes.profile ?? this.profile,
      screening: changes.screening ?? this.screening,
      trainingStatus: changes.trainingStatus ?? this.trainingStatus,
      trainingDaysPerWeek: changes.trainingDaysPerWeek ?? this.trainingDaysPerWeek,
      dailyActivity: changes.dailyActivity ?? this.dailyActivity,
      profileRevision: changes.profileRevision ?? this.profileRevision,
      goalMode: changes.goalMode ?? this.goalMode,
      onboardedOn: this.onboardedOn,
      unitSystem: changes.unitSystem ?? this.unitSystem,
      bodyFatPercent: 'bodyFatPercent' in changes ? changes.bodyFatPercent : this.bodyFatPercent,
      requestedLossFraction:
        'requestedLossFraction' in changes ? changes.requestedLossFraction : this.requestedLossFraction,
      healthCheckConfirmedOn:
        'healthCheckConfirmedOn' in changes ? changes.healthCheckConfirmedOn : this.healthCheckConfirmedOn,
      healthCheckSkipCount: changes.healthCheckSkipCount ?? this.healthCheckSkipCount,
      creatineStartedOn: 'creatineStartedOn' in changes ? changes.creatineStartedOn : this.creatineStartedOn,
      maintenanceWeekFrom: changes.maintenanceWeekFrom ?? this.maintenanceWeekFrom,
      reliefAnsweredOn: changes.reliefAnsweredOn ?? this.reliefAnsweredOn,
    });
  }
}
