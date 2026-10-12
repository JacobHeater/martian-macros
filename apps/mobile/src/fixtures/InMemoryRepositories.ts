import type { CustomExerciseRepository } from '../domain/repositories/CustomExerciseRepository';
import type { CustomFoodRepository } from '../domain/repositories/CustomFoodRepository';
import type { DataEraser } from '../domain/repositories/DataEraser';
import type { DayMarkRepository } from '../domain/repositories/DayMarkRepository';
import type { ExerciseProgressionRepository } from '../domain/repositories/ExerciseProgressionRepository';
import type { FoodRepository } from '../domain/repositories/FoodRepository';
import type { IntakeReader } from '../domain/repositories/IntakeReader';
import type { PauseRepository } from '../domain/repositories/PauseRepository';
import type { PreferencesRepository } from '../domain/repositories/PreferencesRepository';
import type { RecoveryCheckInRepository } from '../domain/repositories/RecoveryCheckInRepository';
import type { ReminderRepository } from '../domain/repositories/ReminderRepository';
import type { SetupRepository } from '../domain/repositories/SetupRepository';
import type { WaistRepository } from '../domain/repositories/WaistRepository';
import type { WeightEventRepository } from '../domain/repositories/WeightEventRepository';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import type { InsightLogRepository } from '../engine/InsightLogRepository';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import type { HealthSampleStore } from '../healthIngest/HealthSampleStore';
import { InMemoryHealthSampleStore } from '../healthIngest/testing/InMemoryHealthSampleStore';
import { InMemoryCustomExerciseRepository } from './InMemoryCustomExerciseRepository';
import { InMemoryCustomFoodRepository } from './InMemoryCustomFoodRepository';
import { InMemoryDataEraser } from './InMemoryDataEraser';
import { InMemoryDayMarkRepository } from './InMemoryDayMarkRepository';
import { InMemoryExerciseProgressionRepository } from './InMemoryExerciseProgressionRepository';
import { InMemoryFoodRepository } from './InMemoryFoodRepository';
import { InMemoryInsightLogRepository } from './InMemoryInsightLogRepository';
import { InMemoryIntakeReader } from './InMemoryIntakeReader';
import { InMemoryPauseRepository } from './InMemoryPauseRepository';
import { InMemoryPreferencesRepository } from './InMemoryPreferencesRepository';
import { InMemoryRecoveryCheckInRepository } from './InMemoryRecoveryCheckInRepository';
import { InMemoryReminderRepository } from './InMemoryReminderRepository';
import { InMemorySetupRepository } from './InMemorySetupRepository';
import { InMemoryTargetsHistoryRepository } from './InMemoryTargetsHistoryRepository';
import { InMemoryWaistRepository } from './InMemoryWaistRepository';
import { InMemoryWeightEventRepository } from './InMemoryWeightEventRepository';
import { InMemoryWeightRepository } from './InMemoryWeightRepository';
import { InMemoryWorkoutRepository } from './InMemoryWorkoutRepository';

/**
 * Every repository, in memory, sharing state where the real ones do (the
 * intake reader sees the food log and day marks; the eraser empties all).
 * The in-memory counterpart of the database's set of repositories.
 */
export class InMemoryRepositories {
  readonly setup: SetupRepository;
  readonly weights: WeightRepository;
  readonly weightEvents: WeightEventRepository;
  readonly waist: WaistRepository;
  readonly food: FoodRepository;
  readonly customFoods: CustomFoodRepository;
  readonly dayMarks: DayMarkRepository;
  readonly intake: IntakeReader;
  readonly targets: TargetsHistoryRepository;
  readonly preferences: PreferencesRepository;
  readonly insightLog: InsightLogRepository;
  readonly pauses: PauseRepository;
  readonly reminders: ReminderRepository;
  readonly recovery: RecoveryCheckInRepository;
  readonly workouts: WorkoutRepository;
  readonly customExercises: CustomExerciseRepository;
  readonly healthSamples: HealthSampleStore;
  readonly exerciseProgressions: ExerciseProgressionRepository;
  readonly eraser: DataEraser;

  constructor() {
    const setup = new InMemorySetupRepository();
    const weights = new InMemoryWeightRepository();
    const weightEvents = new InMemoryWeightEventRepository();
    const waist = new InMemoryWaistRepository();
    const food = new InMemoryFoodRepository();
    const customFoods = new InMemoryCustomFoodRepository();
    const dayMarks = new InMemoryDayMarkRepository();
    const targets = new InMemoryTargetsHistoryRepository();
    const preferences = new InMemoryPreferencesRepository();
    const insightLog = new InMemoryInsightLogRepository();
    const pauses = new InMemoryPauseRepository();
    const reminders = new InMemoryReminderRepository();
    const recovery = new InMemoryRecoveryCheckInRepository();
    const workouts = new InMemoryWorkoutRepository();
    const customExercises = new InMemoryCustomExerciseRepository();
    const healthSamples = new InMemoryHealthSampleStore();
    const exerciseProgressions = new InMemoryExerciseProgressionRepository();

    this.setup = setup;
    this.weights = weights;
    this.weightEvents = weightEvents;
    this.waist = waist;
    this.food = food;
    this.customFoods = customFoods;
    this.dayMarks = dayMarks;
    this.intake = new InMemoryIntakeReader(food, dayMarks);
    this.targets = targets;
    this.preferences = preferences;
    this.insightLog = insightLog;
    this.pauses = pauses;
    this.reminders = reminders;
    this.recovery = recovery;
    this.workouts = workouts;
    this.customExercises = customExercises;
    this.healthSamples = healthSamples;
    this.exerciseProgressions = exerciseProgressions;
    this.eraser = new InMemoryDataEraser([
      () => setup.clear(),
      () => weights.clear(),
      () => weightEvents.clear(),
      () => waist.clear(),
      () => food.clear(),
      () => customFoods.clear(),
      () => dayMarks.clear(),
      () => targets.clear(),
      () => preferences.clear(),
      () => insightLog.clear(),
      () => pauses.clear(),
      () => reminders.clear(),
      () => recovery.clear(),
      () => workouts.clear(),
      () => customExercises.clear(),
      () => healthSamples.clear(),
      () => exerciseProgressions.clear(),
    ]);
  }

  /** Nothing to release; present so it can stand in for the database's set. */
  async close(): Promise<void> {}
}
