import type { Clock } from '../domain/integration/Clock';
import type { Clipboard } from '../domain/integration/Clipboard';
import type { Haptics } from '../domain/integration/Haptics';
import type { ExternalLinks } from '../domain/integration/ExternalLinks';
import type { Platform } from '../domain/integration/Platform';
import type { ReminderScheduler } from '../domain/integration/ReminderScheduler';
import type { ExactAlarms } from '../domain/integration/ExactAlarms';
import type { RestSignal } from '../domain/integration/RestSignal';
import type { CustomExerciseRepository } from '../domain/repositories/CustomExerciseRepository';
import type { CustomFoodRepository } from '../domain/repositories/CustomFoodRepository';
import type { SavedMealRepository } from '../domain/repositories/SavedMealRepository';
import type { DataEraser } from '../domain/repositories/DataEraser';
import type { DataRestorer } from '../domain/repositories/DataRestorer';
import type { BackupPlatform } from '../backup/BackupPlatform';
import type { DayKindRepository } from '../domain/repositories/DayKindRepository';
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
import type { GoalBodyFatRepository } from '../domain/repositories/GoalBodyFatRepository';
import type { MenstruationRepository } from '../domain/repositories/MenstruationRepository';
import type { WaistRepository } from '../domain/repositories/WaistRepository';
import type { MeasurementRepository } from '../domain/repositories/MeasurementRepository';
import type { MeasurementSettingsRepository } from '../domain/repositories/MeasurementSettingsRepository';
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
import type { HealthProfileReader } from '../domain/integration/HealthProfileReader';
import type { HealthWorkoutReader } from '../domain/integration/HealthWorkoutReader';
import type { DeviceLock } from '../domain/integration/DeviceLock';
import type { MealShare } from '../domain/integration/MealShare';
import type { PhotoCamera } from '../domain/integration/PhotoCamera';
import type { PhotoLibrary } from '../domain/integration/PhotoLibrary';
import type { PrivateScreen } from '../domain/integration/PrivateScreen';
import type { ProgressPhotoRepository } from '../domain/repositories/ProgressPhotoRepository';
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
  /** Every site's tape measurements, the waist's among them (MM-156). */
  readonly measurements: MeasurementRepository;
  /** Which sites beyond the waist are measured, the limb side, and the suggestion's answer (MM-156). */
  readonly measurementSettings: MeasurementSettingsRepository;
  /** The days marked with menstrual flow (MM-20). */
  readonly flowDays: MenstruationRepository;
  /** The nights of sleep the person typed (MM-250); imported nights come through `healthSamples`. */
  readonly sleep: SleepRepository;
  readonly water: WaterRepository;
  readonly food: FoodRepository;
  readonly customFoods: CustomFoodRepository;
  /** The meals saved to log again (MM-645). */
  readonly savedMeals: SavedMealRepository;
  readonly dayMarks: DayMarkRepository;
  /** The days marked a Refeed or a Day off (MM-611); no calculation reads them. */
  readonly dayKinds: DayKindRepository;
  readonly intake: IntakeReader;
  readonly targets: TargetsHistoryRepository;
  /** How the user shapes their targets (MM-122, MM-124), kept in the database (MM-486). */
  readonly targetShapes: TargetShapeRepository;
  /** The goal body fat the user set (MM-36), kept in the database (MM-507). */
  readonly goalBodyFat: GoalBodyFatRepository;
  readonly preferences: PreferencesRepository;
  /** The hours in which an imported reading counts as the morning weigh-in (MM-441). */
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

  /** The progress photos, kept apart from the rest of the data (MM-157). */
  readonly progressPhotos: ProgressPhotoRepository;

  /** The camera progress photos are taken with, inside the app (MM-157). */
  readonly photoCamera: PhotoCamera;

  /** The phone's own lock, asked each time the photos are opened (MM-157). */
  readonly deviceLock: DeviceLock;

  /**
   * Keeps a photo out of the app switcher while it shows (MM-157). Android also refuses a screenshot of it; iOS
   * cannot refuse one, so there it covers the app switcher only.
   */
  readonly privateScreen: PrivateScreen;

  /** Workouts on the health platform with their segments (MM-489), for importing them (MM-490). */
  readonly healthWorkouts: HealthWorkoutReader;

  /** Sex, date of birth and height from Apple Health, offered on onboarding's first step (MM-69). */
  readonly healthProfile: HealthProfileReader;

  /** The evidence register as written (MM-143): the Markdown the "How this works" screens are read from. */
  readonly evidence: () => Promise<string>;

  /** Which build this is: "dev" or "prod". The development group of Settings shows only in "dev". */
  readonly environment: string;

  /** Which platform the app is on (MM-403): a screen asks only where the platforms differ. */
  readonly platform: Platform;

  /** How the end of a rest is signalled (MM-191). */
  readonly restSignal: RestSignal;
  /** One short tap when a long press starts choosing foods (MM-661). */
  readonly haptics: Haptics;

  /** The phone's browser, handed an address when the person presses a link (MM-454). The app fetches nothing itself. */
  readonly externalLinks: ExternalLinks;

  /** The phone's clipboard: a prompt copied out to the person's own AI assistant and its answer pasted back (MM-586). */
  readonly clipboard: Clipboard;

  /** The phone's photo picker, for a meal's photos sent to the person's assistant and never kept (MM-599). */
  readonly photoLibrary: PhotoLibrary;

  /** The phone's share sheet, handing a meal's photos and prompt to the person's assistant together (MM-599). */
  readonly mealShare: MealShare;
}
