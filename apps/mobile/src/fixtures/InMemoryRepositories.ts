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
import type { SleepRepository } from '../domain/repositories/SleepRepository';
import type { MenstruationRepository } from '../domain/repositories/MenstruationRepository';
import type { WaistRepository } from '../domain/repositories/WaistRepository';
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import type { WeightEventRepository } from '../domain/repositories/WeightEventRepository';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import type { InlineInsightLogRepository } from '../engine/InlineInsightLogRepository';
import type { InsightSnoozeRepository } from '../engine/InsightSnoozeRepository';
import type { InsightLogRepository } from '../engine/InsightLogRepository';
import type { TargetShapeRepository } from '../domain/repositories/TargetShapeRepository';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import type { HealthSampleStore } from '../healthIngest/HealthSampleStore';
import { InMemoryHealthSampleStore } from '../healthIngest/testing/InMemoryHealthSampleStore';
import { InMemoryCustomExerciseRepository } from './InMemoryCustomExerciseRepository';
import { InMemoryCustomFoodRepository } from './InMemoryCustomFoodRepository';
import { InMemoryDataEraser } from './InMemoryDataEraser';
import { InMemoryDayMarkRepository } from './InMemoryDayMarkRepository';
import { InMemoryExerciseProgressionRepository } from './InMemoryExerciseProgressionRepository';
import { InMemoryFoodRepository } from './InMemoryFoodRepository';
import { InMemoryInlineInsightLogRepository } from './InMemoryInlineInsightLogRepository';
import { InMemoryInsightSnoozeRepository } from './InMemoryInsightSnoozeRepository';
import { InMemoryInsightLogRepository } from './InMemoryInsightLogRepository';
import { InMemoryIntakeReader } from './InMemoryIntakeReader';
import { InMemoryPauseRepository } from './InMemoryPauseRepository';
import { InMemoryPreferencesRepository } from './InMemoryPreferencesRepository';
import { InMemoryRecoveryCheckInRepository } from './InMemoryRecoveryCheckInRepository';
import { InMemoryReminderRepository } from './InMemoryReminderRepository';
import { InMemorySetupRepository } from './InMemorySetupRepository';
import { InMemorySleepRepository } from './InMemorySleepRepository';
import { InMemoryTargetShapeRepository } from './InMemoryTargetShapeRepository';
import { InMemoryTargetsHistoryRepository } from './InMemoryTargetsHistoryRepository';
import { InMemoryMenstruationRepository } from './InMemoryMenstruationRepository';
import { InMemoryWaistRepository } from './InMemoryWaistRepository';
import { InMemoryWaterRepository } from './InMemoryWaterRepository';
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
  readonly flowDays: MenstruationRepository;
  readonly sleep: SleepRepository;
  readonly water: WaterRepository;
  readonly food: FoodRepository;
  readonly customFoods: CustomFoodRepository;
  readonly dayMarks: DayMarkRepository;
  readonly intake: IntakeReader;
  readonly targets: TargetsHistoryRepository;
  readonly targetShapes: TargetShapeRepository;
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

  constructor() {
    const setup = new InMemorySetupRepository();
    const weights = new InMemoryWeightRepository();
    const weightEvents = new InMemoryWeightEventRepository();
    const waist = new InMemoryWaistRepository();
    const flowDays = new InMemoryMenstruationRepository();
    const sleep = new InMemorySleepRepository();
    const water = new InMemoryWaterRepository();
    const food = new InMemoryFoodRepository();
    const customFoods = new InMemoryCustomFoodRepository();
    const dayMarks = new InMemoryDayMarkRepository();
    const targets = new InMemoryTargetsHistoryRepository();
    const targetShapes = new InMemoryTargetShapeRepository();
    const preferences = new InMemoryPreferencesRepository();
    const insightLog = new InMemoryInsightLogRepository();
    const inlineInsightLog = new InMemoryInlineInsightLogRepository();
    const insightSnoozes = new InMemoryInsightSnoozeRepository();
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
    this.flowDays = flowDays;
    this.sleep = sleep;
    this.water = water;
    this.food = food;
    this.customFoods = customFoods;
    this.dayMarks = dayMarks;
    this.intake = new InMemoryIntakeReader(food, dayMarks);
    this.targets = targets;
    this.targetShapes = targetShapes;
    this.preferences = preferences;
    this.insightLog = insightLog;
    this.inlineInsightLog = inlineInsightLog;
    this.insightSnoozes = insightSnoozes;
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
      () => flowDays.clear(),
      () => sleep.clear(),
      () => water.clear(),
      () => food.clear(),
      () => customFoods.clear(),
      () => dayMarks.clear(),
      () => targets.clear(),
      () => targetShapes.clear(),
      () => preferences.clear(),
      () => insightLog.clear(),
      () => inlineInsightLog.clear(),
      () => insightSnoozes.clear(),
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
