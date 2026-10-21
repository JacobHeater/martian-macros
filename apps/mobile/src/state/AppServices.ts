import type { Clock } from '../domain/integration/Clock';
import type { ExternalLinks } from '../domain/integration/ExternalLinks';
import type { Platform } from '../domain/integration/Platform';
import type { ReminderScheduler } from '../domain/integration/ReminderScheduler';
import type { ExactAlarms } from '../domain/integration/ExactAlarms';
import type { RestSignal } from '../domain/integration/RestSignal';
import type { CustomExerciseRepository } from '../domain/repositories/CustomExerciseRepository';
import type { CustomFoodRepository } from '../domain/repositories/CustomFoodRepository';
import type { DataEraser } from '../domain/repositories/DataEraser';
import type { DataRestorer } from '../domain/repositories/DataRestorer';
import type { BackupPlatform } from '../backup/BackupPlatform';
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
import type { TargetShapeRepository } from '../domain/repositories/TargetShapeRepository';
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
import type { PackFileFetch } from '../foodCatalog/download/PackFileFetch';
import type { PackHttp } from '../foodCatalog/download/PackHttp';
import type { PackStore } from '../foodCatalog/download/PackStore';
import type { FoodCatalog } from '../foodCatalog/FoodCatalog';
import type { HealthBackfillMarks } from '../healthIngest/HealthBackfillMarks';
import type { HealthDailySteps } from '../healthIngest/HealthDailySteps';
import type { HealthHistoryAccess } from '../healthIngest/HealthHistoryAccess';
import type { HealthPermissionsPlace } from '../healthIngest/HealthPermissionsPlace';
import type { HealthSampleStore } from '../healthIngest/HealthSampleStore';
import type { HealthSource } from '../healthIngest/HealthSource';
import type { HealthWriting } from '../healthIngest/HealthWriting';
import type { WeighInWindowReader } from '../healthIngest/WeighInWindowReader';
import type { WeighInWindowWriter } from '../healthIngest/WeighInWindowWriter';
import type { HealthWorkoutReader } from '../domain/integration/HealthWorkoutReader';
import type { Watched } from '../lang/Watched';
import type { OnlineFoodCache } from '../foodCatalog/online/OnlineFoodCache';
import type { OnlineFoodSource } from '../foodOnline/OnlineFoodSource';
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
  /** The days marked with menstrual flow (MM-20). */
  readonly flowDays: MenstruationRepository;
  /** The nights of sleep the person typed (MM-250); imported nights come through `healthSamples`. */
  readonly sleep: SleepRepository;
  readonly water: WaterRepository;
  readonly food: FoodRepository;
  readonly customFoods: CustomFoodRepository;
  readonly dayMarks: DayMarkRepository;
  readonly intake: IntakeReader;
  readonly targets: TargetsHistoryRepository;
  /** How the user shapes their targets (MM-122, MM-124), kept in the database (MM-486). */
  readonly targetShapes: TargetShapeRepository;
  readonly preferences: PreferencesRepository;
  /** The hours in which an imported reading counts as the morning weigh-in (MM-441). */
  readonly weighInWindow: WeighInWindowReader & WeighInWindowWriter;
  readonly insightLog: InsightLogRepository;
  readonly inlineInsightLog: InlineInsightLogRepository;
  readonly insightSnoozes: InsightSnoozeRepository;
  readonly pauses: PauseRepository;
  readonly reminders: ReminderRepository;
  readonly recovery: RecoveryCheckInRepository;
  readonly workouts: WorkoutRepository;
  readonly customExercises: CustomExerciseRepository;
  readonly healthSamples: HealthSampleStore & HealthBackfillMarks;
  readonly exerciseProgressions: ExerciseProgressionRepository;
  readonly eraser: DataEraser;
  /** Puts a backup in place of this phone's data (MM-63). */
  readonly restorer: DataRestorer;
  /** The phone's part of a backup: the snapshot, the share sheet and the file picker (MM-63). */
  readonly backup: BackupPlatform;

  /**
   * The installed food packs read as one catalog (MM-42); given again when a
   * pack is installed or removed, the one it replaces closed (MM-386).
   */
  readonly catalog: Watched<FoodCatalog>;

  /** Where downloaded food packs are kept, apart from the user's own data (MM-56). */
  readonly packStore: PackStore;

  /** The network, as far as packs are concerned: the only thing the app ever fetches. */
  readonly packHttp: PackHttp;

  /**
   * How a pack file reaches its unfinished download (MM-387): on the phone,
   * natively, from the connection to the file. Absent, the app reads it
   * through `packHttp` and writes it to `packStore` itself, as a browser, a
   * story or a test does.
   */
  readonly packFetch?: PackFileFetch | undefined;

  /**
   * Where to read the list of downloadable packs, set for each build.
   * Empty means this build offers no downloads and makes no request.
   */
  readonly packManifestUrl: string;

  /** The web services that may be asked for a food the phone does not have, if the person allows it (MM-58). None in a build without them. */
  readonly onlineSources: readonly OnlineFoodSource[];

  /** Foods found online, kept on the phone (MM-58). */
  readonly onlineFoods: OnlineFoodCache;
  readonly barcodeScanner: BarcodeScanner;
  readonly labelReader: LabelTextReader;

  /** The phone's own scheduled notifications (MM-146). Nothing here uses the network. */
  readonly reminderScheduler: ReminderScheduler;

  /** Whether a reminder arrives on the minute or within an hour (MM-248). */
  readonly exactAlarms: ExactAlarms;

  /**
   * The phone's health platform, read (MM-68), with a day's steps as it
   * totals them (MM-442), and where to allow what it no longer asks about
   * (MM-323).
   */
  readonly healthSource: HealthSource & HealthHistoryAccess & HealthDailySteps & HealthPermissionsPlace;

  /**
   * Which kinds the app writes to the health platform, each turned on in
   * Settings with a permission of its own (MM-70, MM-314, MM-489). What is
   * written is the food, water and workout logs as they change: those
   * repositories tell the platform themselves.
   */
  readonly healthWriting: HealthWriting;

  /** Workouts on the health platform with their segments (MM-489), for importing them (MM-490). */
  readonly healthWorkouts: HealthWorkoutReader;

  /** The evidence register as written (MM-143): the Markdown the "How this works" screens are read from. */
  readonly evidence: () => Promise<string>;

  /** Which build this is: "dev" or "prod". The development group of Settings shows only in "dev". */
  readonly environment: string;

  /** Which platform the app is on (MM-403): a screen asks only where the platforms differ. */
  readonly platform: Platform;

  /** How the end of a rest is signalled (MM-191). */
  readonly restSignal: RestSignal;

  /** The phone's browser, handed an address when the person presses a link (MM-454). The app fetches nothing itself. */
  readonly externalLinks: ExternalLinks;
}
