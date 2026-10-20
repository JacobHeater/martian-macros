import type { CustomExerciseRepository } from '../domain/repositories/CustomExerciseRepository';
import type { CustomFoodRepository } from '../domain/repositories/CustomFoodRepository';
import type { DataEraser } from '../domain/repositories/DataEraser';
import type { DataRestorer } from '../domain/repositories/DataRestorer';
import type { DayMarkRepository } from '../domain/repositories/DayMarkRepository';
import type { ExerciseProgressionRepository } from '../domain/repositories/ExerciseProgressionRepository';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { IntakeReader } from '../domain/repositories/IntakeReader';
import type { PauseRepository } from '../domain/repositories/PauseRepository';
import type { PreferencesRepository } from '../domain/repositories/PreferencesRepository';
import type { RecoveryCheckInRepository } from '../domain/repositories/RecoveryCheckInRepository';
import type { ReminderRepository } from '../domain/repositories/ReminderRepository';
import type { SetupRepository } from '../domain/repositories/SetupRepository';
import type { MenstruationRepository } from '../domain/repositories/MenstruationRepository';
import type { WaistRepository } from '../domain/repositories/WaistRepository';
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import type { WeightEventRepository } from '../domain/repositories/WeightEventRepository';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import type { InlineInsightLogRepository } from '../engine/InlineInsightLogRepository';
import type { InsightSnoozeRepository } from '../engine/InsightSnoozeRepository';
import type { InsightLogRepository } from '../engine/InsightLogRepository';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import type { HealthSampleStore } from '../healthIngest/HealthSampleStore';
import type { SqlDatabase } from '../sql/SqlDatabase';
import { AppDatabase } from './AppDatabase';
import { SqlCustomExerciseRepository } from './SqlCustomExerciseRepository';
import { SqlCustomFoodRepository } from './SqlCustomFoodRepository';
import { SqlDataEraser } from './SqlDataEraser';
import { SqlDataRestorer } from './SqlDataRestorer';
import { WasmSqlDatabase } from '../sql/wasm/WasmSqlDatabase';
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
import { SqlTargetsHistoryRepository } from './SqlTargetsHistoryRepository';
import { SqlMenstruationRepository } from './SqlMenstruationRepository';
import { SqlWaistRepository } from './SqlWaistRepository';
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
  readonly waist: WaistRepository;
  readonly flowDays: MenstruationRepository;
  readonly water: WaterRepository;
  readonly food: FoodRepository;
  readonly customFoods: CustomFoodRepository;
  readonly dayMarks: DayMarkRepository;
  readonly intake: IntakeReader;
  readonly targets: TargetsHistoryRepository;
  readonly preferences: PreferencesRepository;
  readonly insightLog: InsightLogRepository;
  readonly inlineInsightLog: InlineInsightLogRepository;
  readonly insightSnoozes: InsightSnoozeRepository;
  readonly pauses: PauseRepository;
  readonly reminders: ReminderRepository;
  readonly recovery: RecoveryCheckInRepository;
  readonly workouts: WorkoutRepository;
  readonly customExercises: CustomExerciseRepository;
  readonly healthSamples: HealthSampleStore;
  readonly exerciseProgressions: ExerciseProgressionRepository;
  readonly eraser: DataEraser;
  readonly restorer: DataRestorer;

  constructor(db: AppDatabase, openSnapshot: (bytes: Uint8Array) => Promise<SqlDatabase>) {
    this.db = db;
    this.setup = new SqlSetupRepository(db);
    this.weights = new SqlWeightRepository(db);
    this.weightEvents = new SqlWeightEventRepository(db);
    this.waist = new SqlWaistRepository(db);
    this.flowDays = new SqlMenstruationRepository(db);
    this.water = new SqlWaterRepository(db);
    this.food = new SqlFoodRepository(db);
    this.customFoods = new SqlCustomFoodRepository(db);
    this.dayMarks = new SqlDayMarkRepository(db);
    this.intake = new SqlIntakeReader(db);
    this.targets = new SqlTargetsHistoryRepository(db);
    this.preferences = new SqlPreferencesRepository(db);
    this.insightLog = new SqlInsightLogRepository(db);
    this.inlineInsightLog = new SqlInlineInsightLogRepository(db);
    this.insightSnoozes = new SqlInsightSnoozeRepository(db);
    this.pauses = new SqlPauseRepository(db);
    this.reminders = new SqlReminderRepository(db);
    this.recovery = new SqlRecoveryCheckInRepository(db);
    this.workouts = new SqlWorkoutRepository(db);
    this.customExercises = new SqlCustomExerciseRepository(db);
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
