import { BiologicalSex } from '../domain/BiologicalSex';
import { DailyActivity } from '../domain/DailyActivity';
import { GoalMode } from '../domain/GoalMode';
import { Profile } from '../domain/Profile';
import type { SetupRepository } from '../domain/repositories/SetupRepository';
import { ScreeningAnswers } from '../domain/ScreeningAnswers';
import { TrainingStatus } from '../domain/TrainingStatus';
import { UnitSystem } from '../domain/UnitSystem';
import { UserSetup } from '../domain/UserSetup';
import type { Watched } from '../lang/Watched';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlRow } from '../sql/SqlRow';
import type { AppDatabase } from './AppDatabase';
import { asFlag, day, flag, integer, named, number, optionalDay, optionalNumber, orNull, text } from './columns';
import { upsert } from './statements';

function setupFrom(r: SqlRow): UserSetup {
  return new UserSetup({
    profile: new Profile({
      // Throws on anything but male or female: never defaults.
      sex: BiologicalSex.parse(text(r, 'sex')),
      birthDate: day(r, 'birth_epoch_day'),
      heightCm: number(r, 'height_cm'),
    }),
    screening: new ScreeningAnswers({
      pregnant: flag(r, 'pregnant'),
      breastfeeding: flag(r, 'breastfeeding'),
      eatingDisorderHistory: flag(r, 'eating_disorder_history'),
      chronicKidneyDisease: flag(r, 'chronic_kidney_disease'),
      androgenUse: flag(r, 'androgen_use'),
      pcos: flag(r, 'pcos'),
      menopause: flag(r, 'menopause'),
      thyroidCondition: flag(r, 'thyroid_condition'),
      insulinOrSulfonylurea: flag(r, 'insulin_or_sulfonylurea'),
      insulinCareTeamConfirmed: flag(r, 'insulin_care_team_confirmed'),
      bariatricSurgery: flag(r, 'bariatric_surgery'),
      weightAffectingMedication: flag(r, 'weight_affecting_medication'),
    }),
    trainingStatus: named(TrainingStatus.values, r, 'training_status'),
    trainingDaysPerWeek: integer(r, 'training_days_per_week'),
    dailyActivity: named(DailyActivity.values, r, 'daily_activity'),
    profileRevision: integer(r, 'profile_revision'),
    goalMode: named(GoalMode.values, r, 'goal_mode'),
    onboardedOn: day(r, 'onboarded_epoch_day'),
    unitSystem: named(UnitSystem.values, r, 'unit_system'),
    bodyFatPercent: optionalNumber(r, 'body_fat_percent'),
    requestedLossFraction: optionalNumber(r, 'requested_loss_fraction'),
    healthCheckConfirmedOn: optionalDay(r, 'health_check_confirmed_epoch_day'),
    healthCheckSkipCount: integer(r, 'health_check_skip_count'),
    creatineStartedOn: optionalDay(r, 'creatine_started_epoch_day'),
    maintenanceWeekFrom: optionalDay(r, 'maintenance_week_from_epoch_day'),
    reliefAnsweredOn: optionalDay(r, 'relief_answered_epoch_day'),
  });
}

async function readSetup(db: SqlDatabase): Promise<UserSetup | undefined> {
  const row = (await db.select('SELECT * FROM setups'))[0];
  return row === undefined ? undefined : setupFrom(row);
}

/** `SetupRepository` kept in the database. */
export class SqlSetupRepository implements SetupRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchSetup(): Watched<UserSetup | undefined> {
    return this.db.watch(['setups'], readSetup);
  }

  loadSetup(): Promise<UserSetup | undefined> {
    return this.db.read(readSetup);
  }

  saveSetup(setup: UserSetup): Promise<void> {
    const s = setup.screening;
    return this.db.write(['setups'], (db) =>
      upsert(db, 'setups', ['id'], {
        id: 1,
        sex: setup.profile.sex,
        birth_epoch_day: setup.profile.birthDate.epochDay,
        height_cm: setup.profile.heightCm,
        training_status: setup.trainingStatus,
        training_days_per_week: setup.trainingDaysPerWeek,
        daily_activity: setup.dailyActivity,
        profile_revision: setup.profileRevision,
        goal_mode: setup.goalMode,
        unit_system: setup.unitSystem,
        onboarded_epoch_day: setup.onboardedOn.epochDay,
        body_fat_percent: orNull(setup.bodyFatPercent),
        requested_loss_fraction: orNull(setup.requestedLossFraction),
        pregnant: asFlag(s.pregnant),
        breastfeeding: asFlag(s.breastfeeding),
        eating_disorder_history: asFlag(s.eatingDisorderHistory),
        chronic_kidney_disease: asFlag(s.chronicKidneyDisease),
        androgen_use: asFlag(s.androgenUse),
        pcos: asFlag(s.pcos),
        menopause: asFlag(s.menopause),
        thyroid_condition: asFlag(s.thyroidCondition),
        insulin_or_sulfonylurea: asFlag(s.insulinOrSulfonylurea),
        insulin_care_team_confirmed: asFlag(s.insulinCareTeamConfirmed),
        bariatric_surgery: asFlag(s.bariatricSurgery),
        weight_affecting_medication: asFlag(s.weightAffectingMedication),
        health_check_confirmed_epoch_day: orNull(setup.healthCheckConfirmedOn?.epochDay),
        health_check_skip_count: setup.healthCheckSkipCount,
        creatine_started_epoch_day: orNull(setup.creatineStartedOn?.epochDay),
        maintenance_week_from_epoch_day: orNull(setup.maintenanceWeekFrom?.epochDay),
        relief_answered_epoch_day: orNull(setup.reliefAnsweredOn?.epochDay),
      }),
    );
  }
}
