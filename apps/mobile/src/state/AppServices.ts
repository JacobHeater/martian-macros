import type { Clock } from '../domain/integration/Clock';
import type { Platform } from '../domain/integration/Platform';
import type { ReminderScheduler } from '../domain/integration/ReminderScheduler';
import type { RestSignal } from '../domain/integration/RestSignal';
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
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import type { WeightEventRepository } from '../domain/repositories/WeightEventRepository';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import type { InlineInsightLogRepository } from '../engine/InlineInsightLogRepository';
import type { InsightSnoozeRepository } from '../engine/InsightSnoozeRepository';
import type { InsightLogRepository } from '../engine/InsightLogRepository';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import type { PackHttp } from '../foodCatalog/download/PackHttp';
import type { PackStore } from '../foodCatalog/download/PackStore';
import type { FoodCatalog } from '../foodCatalog/FoodCatalog';
import type { HealthSampleStore } from '../healthIngest/HealthSampleStore';
import type { HealthSource } from '../healthIngest/HealthSource';
import type { Watched } from '../lang/Watched';
import type { BarcodeScanner } from '../platform/BarcodeScanner';
import type { LabelTextReader } from '../platform/LabelTextReader';

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

  /** The installed food packs read as one catalog (MM-42); given again when a pack is installed or removed. */
  readonly catalog: Watched<FoodCatalog>;

  /** Where downloaded food packs are kept, apart from the user's own data (MM-56). */
  readonly packStore: PackStore;

  /** The network, as far as packs are concerned: the only thing the app ever fetches. */
  readonly packHttp: PackHttp;

  /**
   * Where to read the list of downloadable packs, set for each build.
   * Empty means this build offers no downloads and makes no request.
   */
  readonly packManifestUrl: string;
  readonly barcodeScanner: BarcodeScanner;
  readonly labelReader: LabelTextReader;

  /** The phone's own scheduled notifications (MM-146). Nothing here uses the network. */
  readonly reminderScheduler: ReminderScheduler;

  /** The phone's health platform (MM-68). The app only reads from it. */
  readonly healthSource: HealthSource;

  /** The evidence register as written (MM-143): the Markdown the "How this works" screens are read from. */
  readonly evidence: () => Promise<string>;

  /** Which build this is: "dev" or "prod". The development group of Settings shows only in "dev". */
  readonly environment: string;

  /** Which platform the app is on (MM-403): a screen asks only where the platforms differ. */
  readonly platform: Platform;

  /** How the end of a rest is signalled (MM-191). */
  readonly restSignal: RestSignal;
}
