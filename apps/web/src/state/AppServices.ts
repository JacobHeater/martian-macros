import type { Clock } from '../domain/integration/Clock';
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

/**
 * Everything the app reads and writes, by interface. One place chooses the
 * implementations (the database on the phone, the in-memory ones in a
 * test); nothing else knows which it has. `SqlRepositories` and
 * `InMemoryRepositories` both fit, with a clock added.
 */
export interface AppServices {
  readonly clock: Clock;
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
}
