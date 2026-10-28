import type { CardioSessionRepository } from '../domain/repositories/CardioSessionRepository';
import type { CustomExerciseRepository } from '../domain/repositories/CustomExerciseRepository';
import type { DailyStepsRepository } from '../domain/repositories/DailyStepsRepository';
import type { CustomFoodRepository } from '../domain/repositories/CustomFoodRepository';
import type { SavedMealRepository } from '../domain/repositories/SavedMealRepository';
import type { DataEraser } from '../domain/repositories/DataEraser';
import type { DataRestorer } from '../domain/repositories/DataRestorer';
import type { DayKindRepository } from '../domain/repositories/DayKindRepository';
import type { DayMarkRepository } from '../domain/repositories/DayMarkRepository';
import type { ExerciseProgressionRepository } from '../domain/repositories/ExerciseProgressionRepository';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { IntakeReader } from '../domain/repositories/IntakeReader';
import type { PauseRepository } from '../domain/repositories/PauseRepository';
import type { PreferencesRepository } from '../domain/repositories/PreferencesRepository';
import type { WeighInWindowReader } from '../healthIngest/WeighInWindowReader';
import type { WeighInWindowWriter } from '../healthIngest/WeighInWindowWriter';
import type { RecoveryCheckInRepository } from '../domain/repositories/RecoveryCheckInRepository';
import type { ReminderRepository } from '../domain/repositories/ReminderRepository';
import type { SetupRepository } from '../domain/repositories/SetupRepository';
import type { SleepRepository } from '../domain/repositories/SleepRepository';
import type { TargetShapeRepository } from '../domain/repositories/TargetShapeRepository';
import type { GoalBodyFatRepository } from '../domain/repositories/GoalBodyFatRepository';
import type { MenstruationRepository } from '../domain/repositories/MenstruationRepository';
import type { WaistRepository } from '../domain/repositories/WaistRepository';
import type { MeasurementRepository } from '../domain/repositories/MeasurementRepository';
import type { MeasurementSettingsRepository } from '../domain/repositories/MeasurementSettingsRepository';
import { WaistFromMeasurements } from '../domain/measurements/WaistFromMeasurements';
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import type { WeightEventRepository } from '../domain/repositories/WeightEventRepository';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import type { InlineInsightLogRepository } from '../engine/InlineInsightLogRepository';
import type { InsightSnoozeRepository } from '../engine/InsightSnoozeRepository';
import type { InsightLogRepository } from '../engine/InsightLogRepository';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import type { CoachAdviceRecordRepository } from '../engine/analysis/accountability/CoachAdviceRecordRepository';
import type { TrendLogRepository } from '../engine/trends/TrendLogRepository';
import type { HealthBackfillMarks } from '../healthIngest/HealthBackfillMarks';
import type { HealthSampleStore } from '../healthIngest/HealthSampleStore';
import type { SqlDatabase } from '../sql/SqlDatabase';
import { AppDatabase } from './AppDatabase';
import { SqlCardioSessionRepository } from './SqlCardioSessionRepository';
import { SqlCustomExerciseRepository } from './SqlCustomExerciseRepository';
import { SqlDailyStepsRepository } from './SqlDailyStepsRepository';
import { SqlCustomFoodRepository } from './SqlCustomFoodRepository';
import { SqlSavedMealRepository } from './SqlSavedMealRepository';
import { SqlDataEraser } from './SqlDataEraser';
import { SqlDataRestorer } from './SqlDataRestorer';
import { WasmSqlDatabase } from '../sql/wasm/WasmSqlDatabase';
import { SqlDayKindRepository } from './SqlDayKindRepository';
import { SqlDayMarkRepository } from './SqlDayMarkRepository';
import { SqlExerciseProgressionRepository } from './SqlExerciseProgressionRepository';
import { SqlFoodRepository } from './SqlFoodRepository';
import { SqlHealthSampleStore } from './SqlHealthSampleStore';
import { SqlInlineInsightLogRepository } from './SqlInlineInsightLogRepository';
import { SqlInsightSnoozeRepository } from './SqlInsightSnoozeRepository';
import { SqlInsightLogRepository } from './SqlInsightLogRepository';
import { SqlIntakeReader } from './SqlIntakeReader';
import { SqlPauseRepository } from './SqlPauseRepository';
import { SqlPreferencesRepository } from './SqlPreferencesRepository';
import { SqlRecoveryCheckInRepository } from './SqlRecoveryCheckInRepository';
import { SqlReminderRepository } from './SqlReminderRepository';
import { SqlSetupRepository } from './SqlSetupRepository';
import { SqlSleepRepository } from './SqlSleepRepository';
import { SqlTargetShapeRepository } from './SqlTargetShapeRepository';
import { SqlGoalBodyFatRepository } from './SqlGoalBodyFatRepository';
import { SqlTargetsHistoryRepository } from './SqlTargetsHistoryRepository';
import { SqlTrendLogRepository } from './SqlTrendLogRepository';
import { SqlCoachAdviceRecordRepository } from './SqlCoachAdviceRecordRepository';
import { SqlMenstruationRepository } from './SqlMenstruationRepository';
import { SqlMeasurementRepository } from './SqlMeasurementRepository';
import { SqlMeasurementSettingsRepository } from './SqlMeasurementSettingsRepository';
import { SqlWaterRepository } from './SqlWaterRepository';
import { SqlWeightEventRepository } from './SqlWeightEventRepository';
import { SqlWeightRepository } from './SqlWeightRepository';
import { SqlWorkoutRepository } from './SqlWorkoutRepository';

/**
 * Every repository over one database: the system of record. The in-memory
 * counterpart is `InMemoryRepositories`, and the same contract suites hold
 * both to the same behavior.
 */
export class SqlRepositories {
  private readonly db: AppDatabase;
  readonly setup: SetupRepository;
  readonly weights: WeightRepository;
  readonly weightEvents: WeightEventRepository;
  /** The waist, one site of `measurements` (MM-156). */
  readonly waist: WaistRepository;
  /** Every site's tape measurements, the waist's among them (MM-156). */
  readonly measurements: MeasurementRepository;
  readonly measurementSettings: MeasurementSettingsRepository;
  readonly flowDays: MenstruationRepository;
  /** The nights of sleep the person typed, or imported nights kept beside them (MM-250). */
  readonly sleep: SleepRepository;
  readonly water: WaterRepository;
  readonly food: FoodRepository;
  readonly customFoods: CustomFoodRepository;
  readonly savedMeals: SavedMealRepository;
  readonly dayMarks: DayMarkRepository;
  /** The days marked a Refeed or a Day off (MM-611). */
  readonly dayKinds: DayKindRepository;
  readonly intake: IntakeReader;
  readonly targets: TargetsHistoryRepository;
  /** How the user shapes their targets, by the day each shape was set from (MM-122, MM-124, MM-486). */
  readonly targetShapes: TargetShapeRepository;
  /** The goal body fat the user set (MM-36, MM-507). */
  readonly goalBodyFat: GoalBodyFatRepository;
  readonly preferences: PreferencesRepository;
  /** The weigh-in window (MM-441), a column of the preferences' row. */
  readonly weighInWindow: WeighInWindowReader & WeighInWindowWriter;
  readonly insightLog: InsightLogRepository;
  readonly inlineInsightLog: InlineInsightLogRepository;
  readonly insightSnoozes: InsightSnoozeRepository;
  /** What the trend engine said, and the coach's findings dismissed (MM-605). */
  readonly trendLog: TrendLogRepository;
  /** The coach's record of the advice it showed (MM-617). */
  readonly adviceRecord: CoachAdviceRecordRepository;
  readonly pauses: PauseRepository;
  readonly reminders: ReminderRepository;
  readonly recovery: RecoveryCheckInRepository;
  readonly workouts: WorkoutRepository;
  readonly customExercises: CustomExerciseRepository;
  /** The wearable's cardio sessions and the platform's daily steps (MM-677). */
  readonly cardioSessions: CardioSessionRepository;
  readonly dailySteps: DailyStepsRepository;
  readonly healthSamples: HealthSampleStore & HealthBackfillMarks;
  readonly exerciseProgressions: ExerciseProgressionRepository;
  readonly eraser: DataEraser;
  readonly restorer: DataRestorer;

  constructor(db: AppDatabase, openSnapshot: (bytes: Uint8Array) => Promise<SqlDatabase>) {
    this.db = db;
    this.setup = new SqlSetupRepository(db);
    this.weights = new SqlWeightRepository(db);
    this.weightEvents = new SqlWeightEventRepository(db);
    this.measurements = new SqlMeasurementRepository(db);
    this.waist = new WaistFromMeasurements(this.measurements);
    this.measurementSettings = new SqlMeasurementSettingsRepository(db);
    this.flowDays = new SqlMenstruationRepository(db);
    this.sleep = new SqlSleepRepository(db);
    this.water = new SqlWaterRepository(db);
    this.food = new SqlFoodRepository(db);
    this.customFoods = new SqlCustomFoodRepository(db);
    this.savedMeals = new SqlSavedMealRepository(db);
    this.dayMarks = new SqlDayMarkRepository(db);
    this.dayKinds = new SqlDayKindRepository(db);
    this.intake = new SqlIntakeReader(db);
    this.targets = new SqlTargetsHistoryRepository(db);
    this.targetShapes = new SqlTargetShapeRepository(db);
    this.goalBodyFat = new SqlGoalBodyFatRepository(db);
    const preferences = new SqlPreferencesRepository(db);
    this.preferences = preferences;
    this.weighInWindow = preferences;
    this.insightLog = new SqlInsightLogRepository(db);
    this.inlineInsightLog = new SqlInlineInsightLogRepository(db);
    this.insightSnoozes = new SqlInsightSnoozeRepository(db);
    this.trendLog = new SqlTrendLogRepository(db);
    this.adviceRecord = new SqlCoachAdviceRecordRepository(db);
    this.pauses = new SqlPauseRepository(db);
    this.reminders = new SqlReminderRepository(db);
    this.recovery = new SqlRecoveryCheckInRepository(db);
    this.workouts = new SqlWorkoutRepository(db);
    this.customExercises = new SqlCustomExerciseRepository(db);
    this.cardioSessions = new SqlCardioSessionRepository(db);
    this.dailySteps = new SqlDailyStepsRepository(db);
    this.healthSamples = new SqlHealthSampleStore(db);
    this.exerciseProgressions = new SqlExerciseProgressionRepository(db);
    this.eraser = new SqlDataEraser(db);
    this.restorer = new SqlDataRestorer(db, openSnapshot);
  }

  /**
   * Opens the user's database in `sql`, creating or upgrading it, and every
   * repository over it. `openSnapshot` is how a backup's bytes become a
   * connection to a copy (MM-63): in memory unless the phone gives another way.
   */
  static async open(
    sql: SqlDatabase,
    { openSnapshot = (bytes) => WasmSqlDatabase.open({ bytes }) }: { openSnapshot?: (bytes: Uint8Array) => Promise<SqlDatabase> } = {},
  ): Promise<SqlRepositories> {
    return new SqlRepositories(await AppDatabase.open(sql), openSnapshot);
  }

  close(): Promise<void> {
    return this.db.close();
  }
}
