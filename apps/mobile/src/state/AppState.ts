import type { WaterGoal } from '../domain/water/WaterGoal';
import { suggestedWaterGoalMl } from '../domain/water/suggestedWaterGoalMl';
import type { CalendarDate } from '../domain/CalendarDate';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import { ArgumentError } from '../lang/ArgumentError';
import type { InsightSwitches } from '../domain/InsightSwitches';
import type { DayCompleteness } from '../domain/DayCompleteness';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import type { CookingFatKind } from '../domain/food/CookingFatKind';
import { SodiumDay } from '../domain/food/micros/SodiumDay';
import type { MacroPicture } from '../domain/MacroPicture';
import type { NutritionGoals } from '../domain/NutritionGoals';
import type { WaterEntry } from '../domain/water/WaterEntry';
import type { EasyToMissPreference } from '../domain/food/easyToMiss/EasyToMissPreference';
import type { HandSize } from '../domain/food/hand/HandSize';
import type { FoodEntry } from '../domain/FoodEntry';
import type { IntakeDay } from '../domain/IntakeDay';
import { Meal } from '../domain/Meal';
import type { Pause } from '../domain/Pause';
import type { PlannedReminder } from '../domain/PlannedReminder';
import type { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import type { TermsAcceptance } from '../domain/TermsAcceptance';
import { ReminderKind } from '../domain/ReminderKind';
import { ReminderSetting } from '../domain/ReminderSetting';
import type { ThemePreference } from '../domain/ThemePreference';
import { builtInExercises } from '../domain/training/builtInExercises';
import type { Exercise } from '../domain/training/Exercise';
import type { ExerciseProgression } from '../domain/training/ExerciseProgression';
import type { Workout } from '../domain/training/Workout';
import type { UserSetup } from '../domain/UserSetup';
import type { MenstruationDay } from '../domain/MenstruationDay';
import type { SleepNight } from '../domain/SleepNight';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightEvent } from '../domain/WeightEvent';
import type { WeightObservation } from '../domain/WeightObservation';
import type { AdherenceSummary } from '../engine/AdherenceSummary';
import { analyze } from '../engine/analyze';
import { assessMaintenance } from '../engine/assessMaintenance';
import { assessTrainingLapse } from '../engine/assessTrainingLapse';
import type { TrainingLapse } from '../engine/TrainingLapse';
import { trainingSuspended } from '../engine/trainingSuspended';
import type { MaintenanceStatus } from '../engine/MaintenanceStatus';
import { assessStall } from '../engine/assessStall';
import { describePaces } from '../engine/describePaces';
import type { PaceOption } from '../engine/PaceOption';
import { TargetInputs } from '../engine/TargetInputs';
import { buildMonthlyReport } from '../engine/buildMonthlyReport';
import { buildStrengthTrends } from '../engine/buildStrengthTrends';
import { buildWeeklyVolume } from '../engine/buildWeeklyVolume';
import type { CoachSnapshot } from '../engine/CoachSnapshot';
import type { DailyTargets } from '../engine/DailyTargets';
import { findInsights } from '../engine/findInsights';
import type { SodiumPattern } from '../engine/SodiumPattern';
import type { FiberPattern } from '../engine/FiberPattern';
import { findReliefOffer } from '../engine/findReliefOffer';
import type { MissedPeriod } from '../engine/MissedPeriod';
import { missedPeriodQuestion } from '../engine/missedPeriodQuestion';
import { findUnderEating } from '../engine/findUnderEating';
import { allowedItemInsights } from '../engine/allowedItemInsights';
import type { InlineInsightLogEntry } from '../engine/InlineInsightLogEntry';
import type { InsightLogEntry } from '../engine/InsightLogEntry';
import type { InsightSafeguards } from '../engine/InsightSafeguards';
import type { InsightSnooze } from '../engine/InsightSnooze';
import type { ItemInsight } from '../engine/ItemInsight';
import { itemInsightKinds } from '../engine/itemInsightKinds';
import { InsightRationing } from '../engine/InsightRationing';
import type { InsightSelection } from '../engine/InsightSelection';
import type { LoggingStreak } from '../engine/LoggingStreak';
import { loggingStreakOf } from '../engine/loggingStreakOf';
import type { MonthlyReport } from '../engine/MonthlyReport';
import { openGap } from '../engine/openGap';
import { pausedDaysBetween } from '../engine/pausedDaysBetween';
import { pausedGuide } from '../engine/pausedGuide';
import type { PersonalRecord } from '../engine/PersonalRecord';
import { personalRecordsOf } from '../engine/personalRecordsOf';
import { pauseOn } from '../engine/pauseOn';
import { pauseToResume } from '../engine/pauseToResume';
import { planReminders } from '../engine/planReminders';
import type { RecompReview } from '../engine/RecompReview';
import type { RecompSignal } from '../engine/RecompSignal';
import { recompSignalOf } from '../engine/recompSignalOf';
import { recompReviewOf } from '../engine/recompReviewOf';
import { recoveryCheckInDue } from '../engine/recoveryCheckInDue';
import type { ReliefOffer } from '../engine/ReliefOffer';
import { ReminderFacts } from '../engine/ReminderFacts';
import { reminderIgnoredStreak } from '../engine/reminderIgnoredStreak';
import { ReminderRule } from '../engine/ReminderRule';
import type { ReportPeriod } from '../engine/ReportPeriod';
import { reportPeriods } from '../engine/reportPeriods';
import { selectInsight } from '../engine/selectInsight';
import { trainingItemInsights } from '../engine/trainingItemInsights';
import { foodItemInsights } from '../engine/foodItemInsights';
import { waistWithinNoiseInsights } from '../engine/waistWithinNoiseInsights';
import { waterFewDaysInsights } from '../engine/waterFewDaysInsights';
import { WaterFewDaysRule } from '../engine/WaterFewDaysRule';
import type { SleepAverage } from '../engine/SleepAverage';
import { sleepAverageOf } from '../engine/sleepAverageOf';
import type { StallAssessment } from '../engine/StallAssessment';
import type { StrengthTrend } from '../engine/StrengthTrend';
import { summarizeAdherence } from '../engine/summarizeAdherence';
import type { TargetsRecord } from '../engine/TargetsRecord';
import type { UnderEatingFinding } from '../engine/UnderEatingFinding';
import { underEatingNoticeDue } from '../engine/underEatingNoticeDue';
import type { WeeklyVolume } from '../engine/WeeklyVolume';
import { withoutPausedDays } from '../engine/withoutPausedDays';
import { EvidenceRegister } from '../domain/evidence/EvidenceRegister';
import type { InstalledPack } from '../foodCatalog/download/InstalledPack';
import { StreamedPackFetch } from '../foodCatalog/download/StreamedPackFetch';
import type { FoodCatalog } from '../foodCatalog/FoodCatalog';
import { dailyWeighIns } from '../healthIngest/dailyWeighIns';
import type { DayWeighIn } from '../healthIngest/DayWeighIn';
import type { HealthDataType } from '../healthIngest/HealthDataType';
import { HealthImporter } from '../healthIngest/HealthImporter';
import type { NightOfSleep } from '../healthIngest/NightOfSleep';
import { nightlySleep } from '../healthIngest/nightlySleep';
import type { HealthSample } from '../healthIngest/HealthSample';
import { primaryWeightSource } from '../healthIngest/primaryWeightSource';
import type { Watched } from '../lang/Watched';
import type { AppServices } from './AppServices';
import type { Cell } from './Cell';
import { CheckIn } from './CheckIn';
import { DerivedCell } from './DerivedCell';
import type { HealthConnection } from './HealthConnection';
import type { HomeDestination } from './HomeDestination';
import { Loadable } from './Loadable';
import { mergeSleepNights } from './mergeSleepNights';
import { mergeWeighIns } from './mergeWeighIns';
import { minuteOfDayNow } from './minuteOfDayNow';
import { once } from './once';
import { PackDownloadsController } from './PackDownloadsController';
import { PackManifestCheck } from './PackManifestCheck';
import { OnlineLookup } from './OnlineLookup';
import { StreamCell } from './StreamCell';
import type { ProgressReveal } from './ProgressReveal';
import { ValueCell } from './ValueCell';

const stream = <T>(open: () => Watched<T>) => new StreamCell(open);
const derived = <T>(compute: () => T) => new DerivedCell(compute);

/** The value of a cell that loads, or undefined while it has not. */
const of = <T>(cell: Cell<Loadable<T>>) => Loadable.valueOf(cell.value);

/**
 * Everything the screens show that is worked out from what is stored: the
 * coach's view of the user, the notices that are due, the reminders the
 * phone should have. Each is a cell that follows the store. This is what
 * the Flutter app kept in its providers, with no screen and no browser in
 * it, so it is tested as plain code.
 */
export class AppState {
  private readonly services: AppServices;

  /**
   * The user's current calendar day. Set again by `refreshToday` when the
   * app comes back to the front, so a session left open overnight rolls
   * over.
   */
  readonly today: ValueCell<CalendarDate>;

  /** Counts imports from the health platform; what was imported is read again when it changes. */
  private readonly imports = new ValueCell(0);

  readonly setup: StreamCell<UserSetup | undefined>;

  /** Light, dark or follow the phone (MM-165). */
  readonly themePreference: StreamCell<ThemePreference>;

  /** The agreement to the terms of use, if there is one (MM-242). */
  readonly termsAcceptance: StreamCell<TermsAcceptance | undefined>;
  /** When the last backup was made on this phone, if ever (MM-63). */
  readonly lastBackupOn: StreamCell<CalendarDate | undefined>;

  /** A look being tried on the theme chooser before it is kept (MM-184). */
  readonly themePreview = new ValueCell<ThemePreference | undefined>(undefined);

  /** Which destination is showing. The app starts on the dashboard. */
  readonly homeTab = new ValueCell<HomeDestination>('dashboard');

  /** Every remembered fold (MM-286), by the key its section or disclosure gives, as it was left. */
  readonly folds = new ValueCell<ReadonlyMap<string, boolean>>(new Map());

  /** How far each destination was scrolled when it was left (MM-286), so a return finds it there. */
  readonly destinationScroll = new ValueCell<ReadonlyMap<HomeDestination, number>>(new Map());

  /** The range chosen on the Progress trend (MM-286): 30 or 90 days, kept across visits. */
  readonly progressRangeDays = new ValueCell(30);

  /** What Progress brings into view when it next shows (MM-304): the Waist section from the waist's confirmation. */
  readonly progressReveal = new ValueCell<ProgressReveal | undefined>(undefined);

  /** Whether the repeat health check was put off for this launch (MM-112). */
  readonly healthRecheckDismissed = new ValueCell(false);

  /** Saves new targets when they are due, for as long as it is started. */
  readonly checkIn: CheckIn;

  /** The weigh-ins the user typed, and nothing imported. */
  readonly typedWeights: Cell<Loadable<WeightObservation[]>>;

  /**
   * The imported weigh-in that counts for each day (MM-71), from what has
   * been read and kept. Empty when nothing has been imported.
   */
  readonly importedWeighIns: Cell<Loadable<DayWeighIn[]>>;
  /**
   * The scale the person chose in Settings (MM-71), or undefined while the
   * one with the most weigh-ins in thirty days counts.
   */
  readonly primaryScale: Cell<Loadable<string | undefined>>;

  /**
   * The weigh-ins everything works from: what the user typed and, for any
   * other day, the imported weigh-in that counts (MM-68, MM-71).
   */
  readonly weights: Cell<Loadable<WeightObservation[]>>;
  readonly weightEvents: Cell<Loadable<WeightEvent[]>>;

  /** Every logged workout, most recently started first (MM-75). */
  readonly workouts: Cell<Loadable<Workout[]>>;

  /** The exercises the user added (MM-76). */
  readonly customExercises: Cell<Loadable<Exercise[]>>;

  /** Every exercise that can be chosen: the built-in library and the user's own (MM-76). */
  readonly exercises: Cell<readonly Exercise[]>;

  /** `exercises` by id, for showing what a logged set was of. */
  readonly exercisesById: Cell<ReadonlyMap<string, Exercise>>;

  /** Every pause the user has set (MM-148). */
  readonly pauses: Cell<Loadable<Pause[]>>;

  /** The pause covering today, if any. */
  readonly activePause: Cell<Pause | undefined>;

  /** Intake for the engine: the last 60 days is more than any window needs. */
  readonly intakeDays: Cell<Loadable<IntakeDay[]>>;

  /** Intake for anything that judges a day: paused days are left out. */
  readonly judgedIntake: Cell<readonly IntakeDay[] | undefined>;
  readonly waist: Cell<Loadable<WaistObservation[]>>;

  /** The nights of sleep the person typed, and nothing imported (MM-250). */
  readonly typedSleep: Cell<Loadable<SleepNight[]>>;

  /** The imported sleep that counts for each night (MM-250), from what has been read and kept. Empty when nothing has been imported. */
  readonly importedSleep: Cell<Loadable<NightOfSleep[]>>;

  /** The nights the app works from: typed over imported, oldest first (MM-250). */
  readonly sleepNights: Cell<Loadable<SleepNight[]>>;

  /** The fourteen-night average (MM-252); undefined before the nights are read, or with none in the window. */
  readonly sleepAverage: Cell<SleepAverage | undefined>;
  /** The days marked with menstrual flow (MM-20). */
  readonly flowDays: Cell<Loadable<MenstruationDay[]>>;
  readonly targetsHistory: Cell<Loadable<TargetsRecord[]>>;

  /** The user's own foods and recipes, by name (MM-45). */
  readonly customFoods: Cell<Loadable<CustomFood[]>>;

  /** The setting for the easy-to-miss line (MM-152). */
  readonly easyToMiss: Cell<Loadable<EasyToMissPreference>>;

  /** The size of the person's hand for hand portions (MM-46), once set up. */
  readonly handSize: Cell<HandSize | undefined>;

  /** How much nutrition to show (MM-49). */
  readonly detailLevel: Cell<Loadable<DetailLevel>>;

  /** Which picture of the macros the hero shows (MM-254): bars or donut, never both. */
  readonly macroPicture: Cell<Loadable<MacroPicture>>;

  /** Whether carbohydrate is shown as net of fiber and sugar alcohols (MM-396); on until switched off. */
  readonly netCarbs: Cell<Loadable<boolean>>;
  /** The fat the person usually cooks with (MM-152); oil until one is chosen. */
  readonly usualCookingFat: Cell<Loadable<CookingFatKind>>;
  /** Targets shown exact, unrounded (MM-123); off by default. */
  readonly exactTargets: Cell<Loadable<boolean>>;
  /** The day the line about label accuracy was dismissed (MM-123). */
  readonly labelNoteDismissedOn: Cell<Loadable<CalendarDate | undefined>>;
  /** Leaving a deficit in two steps (MM-130); off by default. */
  readonly easeIntoMaintenance: Cell<Loadable<boolean>>;

  /** The sodium limit, off until set, and the water goal as the person set it (MM-311, MM-313, MM-358). */
  readonly nutritionGoals: Cell<Loadable<NutritionGoals>>;

  /**
   * The water goal in force (MM-358): the person's own amount, or the one
   * suggested for them. Undefined while it is switched off, withheld by the
   * health check, or still being read.
   */
  readonly waterGoal: Cell<WaterGoal | undefined>;
  readonly recentFoods: Cell<Loadable<FoodEntry[]>>;

  /** The engine's current view of the user; undefined until setup and the stored history have loaded. */
  readonly coach: Cell<CoachSnapshot | undefined>;
  /** The three fat-loss paces as they would apply today (MM-128); undefined until the coach exists. */
  readonly paceOptions: Cell<readonly PaceOption[] | undefined>;

  /**
   * The guide shown in place of targets on a paused day (MM-148):
   * maintenance. Undefined when the app shows this person no targets.
   */
  readonly maintenanceGuide: Cell<DailyTargets | undefined>;

  /** What the user did over the seven days to yesterday (MM-149); undefined until the coach has a view. */
  readonly adherenceSummary: Cell<AdherenceSummary | undefined>;

  /**
   * Whether progress has stalled against the goal, and which kind of stall
   * it is (MM-140); undefined until the coach has what it needs to look.
   */
  readonly stallAssessment: Cell<StallAssessment | undefined>;
  /** Where the person stands at maintenance (MM-130); undefined when the targets in force are not maintenance. */
  readonly maintenance: Cell<MaintenanceStatus | undefined>;
  /** Whether training has lapsed against a goal that needs it (MM-134). */
  readonly trainingLapse: Cell<TrainingLapse | undefined>;

  /** Protein by meal for each of the days insights look at (MM-125). */
  readonly mealProtein: Cell<ReadonlyMap<CalendarDate, ReadonlyMap<Meal, number>>>;
  /** The sodium limit and each recent day's sodium, for the coach (MM-312); undefined with no limit. */
  private readonly sodiumPattern: Cell<SodiumPattern | undefined>;
  private readonly fiberPattern: Cell<FiberPattern | undefined>;

  /** The monthly reports that are ready (MM-33), oldest first. */
  readonly reportPeriods: Cell<readonly ReportPeriod[]>;

  /** The rep range and load step the user set, by exercise id (MM-79). */
  readonly exerciseProgressions: Cell<Loadable<ReadonlyMap<string, ExerciseProgression>>>;

  /** How many whole days the user has logged in a row (MM-92). */
  readonly loggingStreak: Cell<LoggingStreak>;

  /** Which insights have been shown and dismissed (MM-141). */
  readonly insightLog: Cell<Loadable<InsightLogEntry[]>>;

  /**
   * The one insight to show today, if any (MM-141): the catalog's rules
   * run over the data to yesterday, then rationed against what was already
   * shown.
   */
  readonly insightSelection: Cell<InsightSelection | undefined>;

  /** The switches of Settings > Coach (MM-364). */
  readonly insightSwitches: Cell<Loadable<InsightSwitches>>;

  /** What the person's answers and state allow of inline insights (MM-362); undefined until setup has loaded. */
  readonly insightSafeguards: Cell<InsightSafeguards | undefined>;

  /**
   * The inline insights to show, every one that holds on an item, the higher
   * priority first, by the item's key (`ItemAnchor.key`) (MM-362, MM-393). Empty until what they rest on has loaded,
   * and when a logged set cannot be worked out (weekly volume says so).
   */
  readonly itemInsights: Cell<ReadonlyMap<string, readonly ItemInsight[]>>;

  /** The inline insights first shown in the last 14 days (MM-363). */
  readonly inlineInsightLog: Cell<Loadable<InlineInsightLogEntry[]>>;

  /** The inline insights snoozed, one kind on one item (MM-378). */
  readonly insightSnoozes: Cell<Loadable<InsightSnooze[]>>;

  /** The water logged over the days the water insight looks at (MM-367). */
  private readonly recentWater: Cell<Loadable<WaterEntry[]>>;

  /** When the welcome-back screen was last put off (MM-147). */
  readonly returnScreenDismissed: Cell<Loadable<CalendarDate | undefined>>;

  /**
   * Whether to show the welcome-back screen: the user is returning from a
   * gap today and has not put the screen off since it began (MM-147).
   */
  readonly welcomeBackDue: Cell<boolean>;

  /**
   * Whether to show the resume screen: a pause has ended, no weigh-in has
   * been saved since, and the screen has not been put off since it ended
   * (MM-148).
   */
  readonly resumeDue: Cell<boolean>;

  /** When the under-eating notice was last dismissed (MM-114). */
  readonly underEatingDismissed: Cell<Loadable<CalendarDate | undefined>>;

  /**
   * What the under-eating rule found over the two weeks to yesterday,
   * whether or not its notice is showing (MM-114).
   */
  readonly underEatingFinding: Cell<UnderEatingFinding | undefined>;

  /** The finding to show now: none when there is none, or it was dismissed in the last two weeks. */
  readonly underEatingNotice: Cell<UnderEatingFinding | undefined>;

  /** Every weekly recovery check-in, oldest first (MM-116). */
  readonly recoveryCheckIns: Cell<Loadable<RecoveryCheckIn[]>>;

  /** When the recovery check-in was last skipped. */
  readonly recoverySkipped: Cell<Loadable<CalendarDate | undefined>>;

  /** Whether to offer the weekly recovery check-in now (MM-116). */
  readonly recoveryCheckInDue: Cell<boolean>;

  /** The offer to ease a deficit, when one is due (MM-117). */
  readonly reliefOffer: Cell<ReliefOffer | undefined>;

  /** The missed-period question for this week's recovery check-in, when it is to be asked (MM-116). */
  readonly missedPeriod: Cell<MissedPeriod | undefined>;

  /** The reminder settings the user has stored (MM-146). */
  readonly reminders: Cell<Loadable<ReminderSetting[]>>;

  /** Every reminder's setting: what is stored, or off at its default time. */
  readonly reminderSettings: Cell<readonly ReminderSetting[]>;

  /** What the reminder rules need to know; undefined until the data has loaded. */
  readonly reminderFacts: Cell<ReminderFacts | undefined>;

  /**
   * The reminders the device should have scheduled (MM-146). Undefined
   * until the data has loaded, and while no reminder has ever been set, so
   * that the scheduler is not touched for a user who never turned one on.
   */
  readonly reminderPlan: Cell<readonly PlannedReminder[] | undefined>;

  /** The reminders that have gone unanswered seven times and paused themselves. */
  readonly selfPausedReminders: Cell<readonly ReminderSetting[]>;

  /** The targets in force today, if any have been issued. */
  readonly currentTargets: Cell<TargetsRecord | undefined>;

  /** The installed packs read as one catalog (MM-42). Empty until a pack is installed. */
  readonly foodCatalog: StreamCell<FoodCatalog>;

  /** Packs on this phone, read again whenever one is installed or removed. */
  readonly installedPacks: Cell<Loadable<InstalledPack[]>>;

  /** Counts installs and removals of packs; what is installed is read again when it changes. */
  private readonly packChanges = new ValueCell(0);

  /** The one food-pack download (MM-56). Nothing starts by itself. */
  readonly packDownloads: PackDownloadsController;

  /** The list of packs the host offers, read once when the user asks. */
  readonly packManifest: PackManifestCheck;

  /** Looking a food up online, if allowed (MM-58). */
  readonly onlineLookup: OnlineLookup;

  /** Each lift's estimated strength over time. Failed when a logged set cannot be worked out. */
  readonly strengthTrends: Cell<Loadable<readonly StrengthTrend[]>>;

  /** The recomp review due today, if one is (MM-133). Not during a pause, which is not time on recomp. */
  readonly recompReview: Cell<RecompReview | undefined>;

  /** The recomp signal as of today (MM-32), from what is logged. Undefined until the weight trend exists. */
  readonly recompSignal: Cell<RecompSignal | undefined>;

  /**
   * The health platform as it stands (MM-68), read afresh whenever it is
   * asked to be, so a permission taken away in the phone's settings is
   * noticed. Undefined where there is no platform or it cannot be asked.
   */
  readonly healthConnection: Cell<Loadable<HealthConnection | undefined>>;

  /** Counts the times the health platform has to be looked at again. */
  private readonly healthLooks = new ValueCell(0);

  /** The evidence register (MM-143), read from the Markdown it is written in. */
  readonly evidenceRegister: Cell<Loadable<EvidenceRegister>>;

  /** Personal records by the id of the workout that set them (MM-92). Empty while the strength history loads. */
  readonly personalRecords: Cell<ReadonlyMap<number, readonly PersonalRecord[]>>;

  /** Hard sets for each muscle group, this week and last. Failed when a logged set cannot be worked out. */
  readonly weeklyVolume: Cell<Loadable<WeeklyVolume>>;

  /** How many days of history the Dashboard shows. */
  readonly dashboardRange = new ValueCell(30);

  /** The day shown on the Food tab; undefined follows the real current day. */
  readonly selectedDay = new ValueCell<CalendarDate | undefined>(undefined);

  private readonly foodByDay = new Map<number, Cell<Loadable<FoodEntry[]>>>();
  private readonly waterByDay = new Map<number, Cell<Loadable<WaterEntry[]>>>();
  private readonly completenessByDay = new Map<number, Cell<Loadable<DayCompleteness>>>();
  private readonly reportIntakeByIndex = new Map<number, Cell<Loadable<IntakeDay[]>>>();
  private readonly reportByIndex = new Map<number, Cell<MonthlyReport | undefined>>();

  constructor(services: AppServices) {
    this.services = services;
    const s = services;
    this.today = new ValueCell(s.clock.today());

    this.setup = stream(() => s.setup.watchSetup());
    this.themePreference = stream(() => s.preferences.watchThemePreference());
    this.termsAcceptance = stream(() => s.preferences.watchTermsAcceptance());
    this.lastBackupOn = stream(() => s.preferences.watchLastBackupOn());
    this.foodCatalog = stream(() => {
      // Read here so that an install or a removal makes this ask again.
      void this.packChanges.value;
      return s.catalog;
    });
    this.installedPacks = stream(() => {
      void this.packChanges.value;
      return once(() => s.packStore.installed());
    });
    this.packDownloads = new PackDownloadsController({
      fetch: s.packFetch ?? new StreamedPackFetch({ http: s.packHttp, store: s.packStore }),
      store: s.packStore,
      onInstalled: () => this.packsChanged(),
    });
    this.packManifest = new PackManifestCheck({ http: s.packHttp, url: s.packManifestUrl });
    this.onlineLookup = new OnlineLookup({
      sources: s.onlineSources,
      cache: s.onlineFoods,
      consent: s.preferences,
      // A food kept is a food the catalog now has: whoever searched asks again.
      onKept: () => this.packsChanged(),
    });
    this.typedWeights = stream(() => s.weights.watchWeights());
    this.primaryScale = stream(() => s.preferences.watchPrimaryScale());
    this.importedWeighIns = stream(() => {
      // Read here so that an import makes this ask again.
      void this.imports.value;
      // And here so that choosing a scale does.
      const chosen = of(this.primaryScale);
      return {
        subscribe: (listener, onError) => {
          let stopped = false;
          s.healthSamples.samples('weight').then(
            (samples) => {
              if (stopped) return;
              const primarySourceId = chosen ?? primaryWeightSource(samples, { asOf: s.clock.now() });
              listener(dailyWeighIns(samples, { primarySourceId }));
            },
            (error: unknown) => {
              if (!stopped) onError?.(error);
            },
          );
          return () => {
            stopped = true;
          };
        },
      };
    });
    this.weights = derived(() => {
      const typed = this.typedWeights.value;
      const imported = of(this.importedWeighIns) ?? [];
      const today = this.today.value;
      // A read that went wrong stays wrong here, so whoever shows the weights can say so.
      if (!typed.ready) return typed;
      return Loadable.of(mergeWeighIns({ typed: typed.value, imported, today }));
    });
    this.weightEvents = stream(() => s.weightEvents.watchWeightEvents());
    this.workouts = stream(() => s.workouts.watchWorkouts());
    this.customExercises = stream(() => s.customExercises.watchCustomExercises());
    this.exercises = derived<readonly Exercise[]>(() => [...builtInExercises, ...(of(this.customExercises) ?? [])]);
    this.exercisesById = derived<ReadonlyMap<string, Exercise>>(() => new Map(this.exercises.value.map((e) => [e.id, e])));
    this.pauses = stream(() => s.pauses.watchPauses());
    this.activePause = derived(() => pauseOn(of(this.pauses) ?? [], this.today.value));
    this.intakeDays = stream(() => s.intake.watchIntakeDays({ since: this.today.value.addDays(-60) }));
    this.judgedIntake = derived(() => {
      const intake = of(this.intakeDays);
      const pauses = of(this.pauses) ?? [];
      if (intake === undefined) return undefined;
      return withoutPausedDays(intake, pauses, { keepComplete: false });
    });
    this.waist = stream(() => s.waist.watchWaist());
    this.typedSleep = stream(() => s.sleep.watchSleepNights());
    this.importedSleep = stream(() => this.importedSamples('sleep', nightlySleep));
    this.sleepNights = derived(() => {
      const typed = this.typedSleep.value;
      const imported = of(this.importedSleep) ?? [];
      const today = this.today.value;
      // A read that went wrong stays wrong here, so whoever shows the nights can say so.
      if (!typed.ready) return typed;
      return Loadable.of(mergeSleepNights({ typed: typed.value, imported, today }));
    });
    this.sleepAverage = derived(() => {
      const nights = of(this.sleepNights);
      return nights === undefined ? undefined : sleepAverageOf({ nights, through: this.today.value });
    });
    this.flowDays = stream(() => s.flowDays.watchFlowDays());
    this.targetsHistory = stream(() => s.targets.watchTargetsHistory());
    this.customFoods = stream(() => s.customFoods.watchCustomFoods());
    this.easyToMiss = stream(() => s.preferences.watchEasyToMiss());
    this.handSize = derived(() => {
      const profile = of(this.setup)?.profile;
      return profile === undefined ? undefined : { heightCm: profile.heightCm, sex: profile.sex };
    });
    this.detailLevel = stream(() => s.preferences.watchDetailLevel());
    this.macroPicture = stream(() => s.preferences.watchMacroPicture());
    this.netCarbs = stream(() => s.preferences.watchNetCarbs());
    this.usualCookingFat = stream(() => s.preferences.watchUsualCookingFat());
    this.exactTargets = stream(() => s.preferences.watchExactTargets());
    this.labelNoteDismissedOn = stream(() => s.preferences.watchLabelNoteDismissedOn());
    this.easeIntoMaintenance = stream(() => s.preferences.watchEaseIntoMaintenance());
    this.nutritionGoals = stream(() => s.preferences.watchNutritionGoals());
    this.recentFoods = stream(() => s.food.watchRecentFoods());

    this.coach = derived(() => {
      const setup = of(this.setup);
      const weights = of(this.weights);
      const weightEvents = of(this.weightEvents);
      const intake = of(this.intakeDays);
      const history = of(this.targetsHistory);
      const pauses = of(this.pauses);
      // Period days widen the trend's noise around each start (MM-19, MM-20); none until read, as with no marked days.
      const flowDays = of(this.flowDays) ?? [];
      const today = this.today.value;
      if (
        setup === undefined ||
        weights === undefined ||
        weightEvents === undefined ||
        intake === undefined ||
        history === undefined ||
        pauses === undefined
      ) {
        return undefined;
      }
      return analyze({ setup, weights, intake, history, weightEvents, pauses, flowDays, today });
    });

    this.maintenanceGuide = derived(() => {
      const setup = of(this.setup);
      const snapshot = this.coach.value;
      if (setup === undefined || snapshot === undefined || !snapshot.policy.targetsAllowed) return undefined;
      return pausedGuide({ setup, snapshot });
    });

    this.adherenceSummary = derived(() => {
      const snapshot = this.coach.value;
      const intake = this.judgedIntake.value;
      const weights = of(this.weights);
      const history = of(this.targetsHistory);
      const paused = this.pauseWithin(7);
      if (snapshot === undefined || intake === undefined || weights === undefined) return undefined;
      if (paused) return undefined;
      return summarizeAdherence({
        through: this.today.value.addDays(-1),
        intake,
        weights,
        history: snapshot.policy.targetsAllowed ? (history ?? []) : [],
        floorKcal: snapshot.calorieFloorKcal,
        // The week's workouts, the fifth fact, now that the training log exists (MM-149).
        workouts: of(this.workouts),
      });
    });

    this.trainingLapse = derived<TrainingLapse | undefined>(() => {
      const setup = of(this.setup);
      const workouts = of(this.workouts);
      const pauses = of(this.pauses);
      if (setup === undefined || workouts === undefined || pauses === undefined) return undefined;
      return assessTrainingLapse({ setup, workouts, pauses, today: this.today.value });
    });

    this.maintenance = derived<MaintenanceStatus | undefined>(() => {
      const setup = of(this.setup);
      const snapshot = this.coach.value;
      const history = of(this.targetsHistory);
      if (setup === undefined || snapshot === undefined || history === undefined) return undefined;
      return assessMaintenance({ setup, history, trend: snapshot.trend, today: this.today.value });
    });

    this.stallAssessment = derived(() => {
      const setup = of(this.setup);
      const snapshot = this.coach.value;
      const intake = this.judgedIntake.value;
      const weights = of(this.weights);
      const history = of(this.targetsHistory);
      const waist = of(this.waist) ?? [];
      const weightEvents = of(this.weightEvents) ?? [];
      const workouts = of(this.workouts) ?? [];
      const paused = this.pauseWithin(14);
      if (
        setup === undefined ||
        snapshot === undefined ||
        intake === undefined ||
        weights === undefined ||
        history === undefined ||
        !snapshot.policy.targetsAllowed ||
        paused
      ) {
        return undefined;
      }
      // With period days marked, the stall is judged over 21 days, not 28 (MM-140).
      const hasCycleData = (of(this.flowDays) ?? []).length > 0;
      return assessStall({
        setup,
        snapshot,
        history,
        intake,
        weights,
        waist,
        weightEvents,
        workouts,
        hasCycleData,
        sleepAverage: this.sleepAverage.value,
        today: this.today.value,
      });
    });

    this.mealProtein = derived<ReadonlyMap<CalendarDate, ReadonlyMap<Meal, number>>>(() => {
      const today = this.today.value;
      const byDay = new Map<CalendarDate, ReadonlyMap<Meal, number>>();
      for (let i = 1; i <= InsightRationing.patternDays; i++) {
        const day = today.addDays(-i);
        const entries = of(this.foodForDay(day));
        if (entries === undefined) continue;
        byDay.set(
          day,
          new Map(
            Meal.values.map((meal) => [
              meal,
              entries.filter((e) => e.meal === meal).reduce((sum, e) => sum + e.proteinG, 0),
            ]),
          ),
        );
      }
      return byDay;
    });

    // Before the fiber pattern, which reads it (MM-126).
    this.recoveryCheckIns = stream(() => s.recovery.watchRecoveryCheckIns());

    // Fiber only at Full detail, where it is shown (MM-126): below it the insight would be about a number never seen.
    this.fiberPattern = derived<FiberPattern | undefined>(() => {
      const sex = of(this.setup)?.profile.sex;
      const level = of(this.detailLevel);
      const checkIns = of(this.recoveryCheckIns);
      if (sex === undefined || level === undefined || !DetailLevel.showsExtras(level) || checkIns === undefined) return undefined;
      const today = this.today.value;
      const days = new Map<CalendarDate, readonly FoodEntry[]>();
      for (let i = 1; i <= InsightRationing.patternDays; i++) {
        const day = today.addDays(-i);
        const entries = of(this.foodForDay(day));
        if (entries !== undefined) days.set(day, entries);
      }
      return { sex, days, checkIns };
    });

    this.sodiumPattern = derived<SodiumPattern | undefined>(() => {
      const goals = of(this.nutritionGoals);
      const limitMg = goals?.sodiumLimitMg;
      const since = goals?.sodiumLimitSince;
      if (limitMg === undefined || since === undefined) return undefined;
      const today = this.today.value;
      const days = new Map<CalendarDate, SodiumDay>();
      for (let i = 1; i <= InsightRationing.patternDays; i++) {
        const day = today.addDays(-i);
        const entries = of(this.foodForDay(day));
        if (entries !== undefined) days.set(day, SodiumDay.of(entries));
      }
      return { limitMg, since, days };
    });

    this.reportPeriods = derived<readonly ReportPeriod[]>(() => {
      const setup = of(this.setup);
      const today = this.today.value;
      if (setup === undefined) return [];
      return reportPeriods({ onboardedOn: setup.onboardedOn, today });
    });

    this.exerciseProgressions = stream(() => {
      const all = s.exerciseProgressions.watchExerciseProgressions();
      return {
        subscribe: (listener, onError) =>
          all.subscribe((list) => listener(new Map(list.map((p) => [p.exerciseId, p]))), onError),
      };
    });

    this.loggingStreak = derived(() =>
      loggingStreakOf({ today: this.today.value, intake: of(this.intakeDays) ?? [], pauses: of(this.pauses) ?? [] }),
    );

    this.insightLog = stream(() => s.insightLog.watchInsightLog());

    this.insightSelection = derived(() => {
      const setup = of(this.setup);
      const intake = this.judgedIntake.value;
      const weights = of(this.weights);
      const history = of(this.targetsHistory);
      const log = of(this.insightLog);
      const coach = this.coach.value;
      const paused = this.pauseWithin(InsightRationing.patternDays);
      const today = this.today.value;
      if (
        setup === undefined ||
        intake === undefined ||
        weights === undefined ||
        history === undefined ||
        log === undefined ||
        coach === undefined ||
        paused
      ) {
        return undefined;
      }
      return selectInsight({
        candidates: findInsights({
          through: today.addDays(-1),
          intake,
          weights,
          history,
          stall: this.stallAssessment.value,
          mealProtein: this.mealProtein.value,
          sodium: this.sodiumPattern.value,
          trend: coach.trend,
          waist: of(this.waist) ?? [],
          limitToProteinAndLogging: setup.screening.eatingDisorderHistory,
          sleepAverage: this.sleepAverage.value,
          fiber: this.fiberPattern.value,
        }),
        log,
        today,
      });
    });

    this.insightSwitches = stream(() => s.preferences.watchInsightSwitches());
    this.insightSnoozes = stream(() => s.insightSnoozes.watchInsightSnoozes());
    this.recentWater = stream(() =>
      s.water.watchWaterSince(this.today.value.addDays(-(WaterFewDaysRule.windowDays + WaterFewDaysRule.usedWithinDays))),
    );

    this.insightSafeguards = derived<InsightSafeguards | undefined>(() => {
      const setup = of(this.setup);
      const policy = this.coach.value?.policy;
      if (setup === undefined || policy === undefined) return undefined;
      return {
        adult: setup.profile.isAdultOn(this.today.value),
        eatingDisorderHistory: setup.screening.eatingDisorderHistory,
        // Weight cannot be hidden yet (MM-118).
        weightHidden: false,
        paused: this.activePause.value !== undefined,
        underEating: this.underEatingFinding.value !== undefined,
        cautions: policy.cautions,
      };
    });

    this.itemInsights = derived<ReadonlyMap<string, readonly ItemInsight[]>>(() => {
      const safeguards = this.insightSafeguards.value;
      const switches = of(this.insightSwitches);
      const snoozes = of(this.insightSnoozes);
      const workouts = of(this.workouts);
      const pauses = of(this.pauses);
      const exercisesById = this.exercisesById.value;
      const today = this.today.value;
      if (safeguards === undefined || switches === undefined || snoozes === undefined || workouts === undefined || pauses === undefined) {
        return new Map();
      }
      const setup = of(this.setup);
      const waist = of(this.waist) ?? [];
      const water = of(this.recentWater) ?? [];
      // The food of the last two weeks: an older day's entries get no line.
      const entries: FoodEntry[] = [];
      for (let i = 0; i < InsightRationing.patternDays; i++) entries.push(...(of(this.foodForDay(today.addDays(-i))) ?? []));
      let insights: ItemInsight[];
      try {
        insights = [
          ...foodItemInsights({ entries, proteinMinimumG: this.currentTargets.value?.targets.proteinMinimumG }),
          ...trainingItemInsights({
            workouts,
            exercisesById,
            pauses,
            today,
            trends: of(this.strengthTrends) ?? [],
            history: of(this.targetsHistory) ?? [],
            deficitRestartOn: this.coach.value?.deficitRestartOn,
            progressStalled: this.stallAssessment.value?.status === 'stalled',
          }),
          ...waistWithinNoiseInsights({ waist }),
          ...(setup === undefined ? [] : waterFewDaysInsights({ entries: water, goal: this.waterGoal.value, onboardedOn: setup.onboardedOn, today })),
        ];
      } catch (error) {
        if (error instanceof ArgumentError) return new Map();
        throw error;
      }
      return allowedItemInsights({ insights, kinds: itemInsightKinds, safeguards, switches, snoozes, today });
    });

    this.inlineInsightLog = stream(() => s.inlineInsightLog.watchInlineInsightLog({ since: this.today.value.addDays(-13) }));

    this.returnScreenDismissed = stream(() => s.preferences.watchReturnScreenDismissedOn());

    this.welcomeBackDue = derived(() => {
      const weights = of(this.weights);
      const intake = of(this.intakeDays);
      const dismissed = this.returnScreenDismissed.value;
      const pauses = of(this.pauses) ?? [];
      const today = this.today.value;
      if (weights === undefined || intake === undefined || !dismissed.ready) return false;
      const gap = openGap({ weights, intake, today, pauses });
      if (gap === undefined) return false;
      const putOff = dismissed.value;
      return putOff === undefined || putOff.isBefore(gap.from);
    });

    this.resumeDue = derived(() => {
      const weights = of(this.weights);
      const pauses = of(this.pauses);
      const dismissed = this.returnScreenDismissed.value;
      const today = this.today.value;
      if (weights === undefined || pauses === undefined || !dismissed.ready) return false;
      const pause = pauseToResume({ pauses, weights, today });
      if (pause === undefined) return false;
      const putOff = dismissed.value;
      return putOff === undefined || !putOff.isAfter(pause.to);
    });

    this.underEatingDismissed = stream(() => s.preferences.watchUnderEatingDismissedOn());

    this.underEatingFinding = derived(() => {
      const snapshot = this.coach.value;
      const intake = this.judgedIntake.value;
      const today = this.today.value;
      if (snapshot === undefined || intake === undefined) return undefined;
      return findUnderEating({ through: today.addDays(-1), intake, floorKcal: snapshot.calorieFloorKcal });
    });

    this.underEatingNotice = derived(() => {
      const finding = this.underEatingFinding.value;
      const dismissed = this.underEatingDismissed.value;
      const today = this.today.value;
      if (finding === undefined || !dismissed.ready) return undefined;
      return underEatingNoticeDue({ today, dismissedOn: dismissed.value }) ? finding : undefined;
    });

    this.recoverySkipped = stream(() => s.preferences.watchRecoveryCheckInSkippedOn());

    this.recoveryCheckInDue = derived(() => {
      const setup = of(this.setup);
      const checkIns = of(this.recoveryCheckIns);
      const skipped = this.recoverySkipped.value;
      const paused = this.activePause.value !== undefined;
      const today = this.today.value;
      if (setup === undefined || checkIns === undefined || !skipped.ready) return false;
      return recoveryCheckInDue({
        today,
        onboardedOn: setup.onboardedOn,
        checkIns,
        skippedOn: skipped.value,
        paused,
      });
    });

    this.reliefOffer = derived(() => {
      const setup = of(this.setup);
      const snapshot = this.coach.value;
      const checkIns = of(this.recoveryCheckIns);
      const history = of(this.targetsHistory);
      const pauses = of(this.pauses) ?? [];
      const today = this.today.value;
      if (
        setup === undefined ||
        snapshot === undefined ||
        checkIns === undefined ||
        history === undefined ||
        !snapshot.policy.targetsAllowed
      ) {
        return undefined;
      }
      return findReliefOffer({
        setup,
        checkIns,
        history,
        today,
        deficitRestartOn: snapshot.deficitRestartOn,
        pauses,
        // Short sleep from the record is a signal of its own (MM-252).
        sleepAverage: this.sleepAverage.value,
        // Falling lifts are the strength trigger (MM-117, MM-77); none until the log has loaded.
        strengthTrends: of(this.strengthTrends) ?? [],
      });
    });

    this.missedPeriod = derived(() => {
      const setup = of(this.setup);
      const flowDays = of(this.flowDays);
      const checkIns = of(this.recoveryCheckIns);
      if (setup === undefined || flowDays === undefined || checkIns === undefined) return undefined;
      return missedPeriodQuestion({ setup, flowDays, checkIns, today: this.today.value });
    });

    this.reminders = stream(() => s.reminders.watchReminders());

    this.reminderSettings = derived<readonly ReminderSetting[]>(() => {
      const stored = of(this.reminders) ?? [];
      return ReminderKind.values.map(
        (kind) =>
          stored.find((setting) => setting.kind === kind) ??
          new ReminderSetting({ kind, minuteOfDay: ReminderRule.defaultMinuteOfDay(kind) }),
      );
    });

    this.reminderFacts = derived(() => {
      const weights = of(this.weights);
      const intake = of(this.intakeDays);
      const waist = of(this.waist);
      const pauses = of(this.pauses);
      if (weights === undefined || intake === undefined || waist === undefined || pauses === undefined) {
        return undefined;
      }
      return new ReminderFacts({
        weighInDays: weights.map((w) => w.date),
        foodDays: intake.filter((d) => d.kcal > 0).map((d) => d.date),
        waistDays: waist.map((w) => w.date),
        pauses,
      });
    });

    this.reminderPlan = derived<readonly PlannedReminder[] | undefined>(() => {
      const stored = of(this.reminders);
      const facts = this.reminderFacts.value;
      const today = this.today.value;
      if (stored === undefined || stored.length === 0 || facts === undefined) return undefined;
      return planReminders({ settings: stored, facts, today, minuteNow: minuteOfDayNow(s.clock) });
    });

    this.selfPausedReminders = derived<readonly ReminderSetting[]>(() => {
      const stored = of(this.reminders);
      const facts = this.reminderFacts.value;
      const today = this.today.value;
      if (stored === undefined || facts === undefined) return [];
      const minuteNow = minuteOfDayNow(s.clock);
      return stored.filter(
        (setting) => reminderIgnoredStreak({ setting, facts, today, minuteNow }) >= ReminderRule.ignoredLimit,
      );
    });

    this.currentTargets = derived(() => {
      const setup = of(this.setup);
      const history = of(this.targetsHistory);
      const today = this.today.value;
      if (
        setup === undefined ||
        !CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }).targetsAllowed
      ) {
        return undefined;
      }
      return history === undefined ? undefined : history[history.length - 1];
    });

    this.paceOptions = derived<readonly PaceOption[] | undefined>(() => {
      const setup = of(this.setup);
      const snapshot = this.coach.value;
      const current = this.currentTargets.value;
      if (setup === undefined || snapshot === undefined || !snapshot.policy.targetsAllowed) return undefined;
      return describePaces(
        new TargetInputs({
          sex: setup.profile.sex,
          heightCm: setup.profile.heightCm,
          trendWeightKg: snapshot.trendWeightKg,
          bodyFat: snapshot.bodyFat,
          mode: 'fatLoss',
          trainingStatus: setup.trainingStatus,
          trainingDaysPerWeek: setup.trainingDaysPerWeek,
          policy: snapshot.policy,
          tdeeKcal: snapshot.tdee.kcal,
          bmrKcal: snapshot.bmrKcal,
          safetyBodyFatPercent: current?.safetyBodyFatPercent,
        }),
      );
    });

    this.waterGoal = derived<WaterGoal | undefined>(() => {
      const goals = of(this.nutritionGoals);
      const setup = of(this.setup);
      if (goals === undefined || setup === undefined || goals.waterGoalOff) return undefined;
      const weights = of(this.weights) ?? [];
      const suggestedMl = suggestedWaterGoalMl({
        sex: setup.profile.sex,
        // The latest weigh-in, not the coach's trend: watching the coach would work it out on every food change.
        weightKg: weights[weights.length - 1]?.weightKg,
        proteinTargetG: this.currentTargets.value?.targets.proteinG,
        trainingDaysPerWeek: setup.trainingDaysPerWeek,
        screening: setup.screening,
        units: setup.unitSystem,
      });
      if (goals.waterGoalMl !== undefined) return { ml: goals.waterGoalMl, suggested: false, suggestedMl };
      return suggestedMl === undefined ? undefined : { ml: suggestedMl, suggested: true, suggestedMl };
    });

    this.strengthTrends = derived<Loadable<readonly StrengthTrend[]>>(() => {
      const sources: Loadable<unknown>[] = [this.workouts.value, this.weights.value, this.customExercises.value];
      for (const source of sources) if (!source.ready && 'error' in source) return Loadable.failed(source.error);
      const workouts = of(this.workouts);
      const weights = of(this.weights);
      if (workouts === undefined || weights === undefined || of(this.customExercises) === undefined) {
        return Loadable.loading;
      }
      try {
        return Loadable.of(
          buildStrengthTrends({ workouts, weights, exercises: this.exercises.value, today: this.today.value }),
        );
      } catch (error) {
        return Loadable.failed(error);
      }
    });

    this.recompReview = derived(() => {
      const snapshot = this.coach.value;
      const history = of(this.targetsHistory);
      if (
        snapshot === undefined ||
        history === undefined ||
        !snapshot.policy.targetsAllowed ||
        this.activePause.value !== undefined
      ) {
        return undefined;
      }
      return recompReviewOf({
        history,
        trend: snapshot.trend,
        waist: of(this.waist) ?? [],
        strengthTrends: of(this.strengthTrends) ?? [],
        recommendation: snapshot.recommendation,
        today: this.today.value,
      });
    });

    this.recompSignal = derived(() => {
      const trend = this.coach.value?.trend;
      if (trend === undefined) return undefined;
      return recompSignalOf({
        trend,
        weights: of(this.weights) ?? [],
        waist: of(this.waist) ?? [],
        strengthTrends: of(this.strengthTrends) ?? [],
        today: this.today.value,
      });
    });

    this.healthConnection = stream(() => {
      // Read here so that asking for another look makes this ask again.
      void this.healthLooks.value;
      return once(async (): Promise<HealthConnection | undefined> => {
        try {
          const available = await s.healthSource.available();
          const permitted = available.size === 0 ? new Set<HealthDataType>() : await s.healthSource.permitted();
          const imported = new Map<HealthDataType, readonly HealthSample[]>();
          for (const type of permitted) imported.set(type, await s.healthSamples.samples(type));
          return { available, permitted, imported };
        } catch {
          // No platform on this kind of device, or its plugin is not there.
          return undefined;
        }
      });
    });

    this.evidenceRegister = stream(() => once(async () => EvidenceRegister.parse(await s.evidence())));

    this.personalRecords = derived<ReadonlyMap<number, readonly PersonalRecord[]>>(() =>
      personalRecordsOf(of(this.strengthTrends) ?? []),
    );

    this.weeklyVolume = derived<Loadable<WeeklyVolume>>(() => {
      const sources: Loadable<unknown>[] = [this.workouts.value, this.customExercises.value];
      for (const source of sources) if (!source.ready && 'error' in source) return Loadable.failed(source.error);
      const workouts = of(this.workouts);
      if (workouts === undefined || of(this.customExercises) === undefined) return Loadable.loading;
      try {
        return Loadable.of(buildWeeklyVolume({ workouts, exercises: this.exercises.value, today: this.today.value }));
      } catch (error) {
        return Loadable.failed(error);
      }
    });

    this.checkIn = this.makeCheckIn();
  }

  /** Reads again which packs are installed, and the catalog made of them. */
  packsChanged(): void {
    // Two packs installing in one tick re-open the catalog once (MM-384, the panel's F3).
    if (this.packsChangedQueued) return;
    this.packsChangedQueued = true;
    queueMicrotask(() => {
      this.packsChangedQueued = false;
      this.packChanges.put(this.packChanges.peek() + 1);
    });
  }

  private packsChangedQueued = false;

  /** Looks at the health platform again: what it has, what is allowed, what has been imported. */
  refreshHealthConnection(): void {
    this.healthLooks.put(this.healthLooks.peek() + 1);
  }

  /**
   * Reads what the user has allowed from the health platform (MM-68) and
   * brings what is kept up to date. False when the platform could not be
   * read, in which case nothing kept was changed.
   *
   * It is run while the app is on screen: when it opens, when it comes
   * back to the front, and when asked for in Settings. The platform
   * refuses to be read at any other time.
   */
  async syncHealth(): Promise<boolean> {
    const { healthSource: source, healthSamples: store } = this.services;
    let changed = false;
    try {
      const importer = new HealthImporter({ source, store });
      for (const type of await source.permitted()) {
        const result = await importer.import(type);
        changed = changed || result.status === 'readAgain' || result.upserted > 0 || result.deleted > 0;
      }
      return true;
    } catch {
      // The platform could not be read, or there is none on this kind of device.
      return false;
    } finally {
      // Only when something was read, so the screens that work from the
      // weigh-ins are not made to reload every time the app comes forward.
      if (changed) this.healthImported();
      this.refreshHealthConnection();
    }
  }

  /**
   * Keeps what the phone has scheduled equal to the reminder plan for as
   * long as the app is open (MM-146). The plan is remade whenever a
   * setting or the data behind it changes, so a weigh-in cancels today's
   * prompt. Until a reminder has been set there is no plan and the
   * scheduler is never touched. Gives the way to stop.
   */
  keepRemindersScheduled(): () => void {
    return this.reminderPlan.subscribe((plan) => {
      if (plan !== undefined) void this.services.reminderScheduler.replaceAll(plan);
    });
  }

  /** Reads again what the weekly volume is worked out from, after a read went wrong. */
  retryWeeklyVolume(): void {
    for (const cell of [this.workouts, this.customExercises]) {
      if (cell instanceof StreamCell) cell.retry();
    }
  }

  /** Reads again what the strength trends are worked out from, after a read went wrong. */
  retryStrengthHistory(): void {
    for (const cell of [this.typedWeights, this.workouts, this.customExercises]) {
      if (cell instanceof StreamCell) cell.retry();
    }
  }

  /** Reads the nights of sleep again, typed and imported, after a read went wrong (MM-250). */
  retrySleep(): void {
    for (const cell of [this.typedSleep, this.importedSleep]) {
      if (cell instanceof StreamCell) cell.retry();
    }
  }

  /** Reads the pauses again, after a read went wrong (MM-334). */
  retryPauses(): void {
    if (this.pauses instanceof StreamCell) this.pauses.retry();
  }

  /** Reads again what the coach works from, after a read went wrong (MM-340). */
  retryCoach(): void {
    for (const cell of [this.typedWeights, this.weightEvents, this.intakeDays, this.targetsHistory, this.pauses]) {
      if (cell instanceof StreamCell) cell.retry();
    }
  }

  /** Reads again what the Dashboard's history is drawn from, after a read went wrong (MM-335). */
  retryHistory(): void {
    for (const cell of [this.intakeDays, this.typedWeights, this.waist, this.targetsHistory, this.pauses, this.recoveryCheckIns]) {
      if (cell instanceof StreamCell) cell.retry();
    }
  }

  /** Reads again what the Dashboard is drawn from, after a read went wrong (MM-334). */
  retryDashboard(): void {
    for (const cell of [this.pauses, this.foodForDay(this.today.value), this.targetsHistory, this.typedWeights]) {
      if (cell instanceof StreamCell) cell.retry();
    }
  }

  /** What the check-in needs; made last, once everything it reads exists. */
  private makeCheckIn(): CheckIn {
    return new CheckIn({
      setup: () => of(this.setup),
      coach: this.coach,
      history: () => of(this.targetsHistory),
      pauses: () => of(this.pauses) ?? [],
      easeIntoMaintenance: () => of(this.easeIntoMaintenance),
      trainingLapsed: () => {
        const setup = of(this.setup);
        const workouts = of(this.workouts);
        if (setup === undefined || workouts === undefined) return undefined;
        return trainingSuspended({ setup, workouts, today: this.today.value });
      },
      // A record that could not be read is no record: the check-in is not held up for it.
      sleepNights: () => (Loadable.hasFailed(this.sleepNights.value) ? [] : of(this.sleepNights)),
      today: this.today,
      targets: this.services.targets,
      setups: this.services.setup,
    });
  }

  /** Reads the day from the clock again; call when the app comes back to the front. */
  refreshToday(): void {
    this.today.put(this.services.clock.today());
  }

  /** Call after an import from the health platform, so what was imported is read again. */
  healthImported(): void {
    this.imports.put(this.imports.value + 1);
  }

  /**
   * What has been read and kept of `type`, as `derive` makes it, read again
   * after every import (MM-68, MM-250).
   */
  private importedSamples<T>(type: HealthDataType, derive: (samples: HealthSample[]) => T): Watched<T> {
    // Read here so that an import makes this ask again.
    void this.imports.value;
    const store = this.services.healthSamples;
    return {
      subscribe: (listener, onError) => {
        let stopped = false;
        store.samples(type).then(
          (samples) => {
            if (!stopped) listener(derive(samples));
          },
          (error: unknown) => {
            if (!stopped) onError?.(error);
          },
        );
        return () => {
          stopped = true;
        };
      },
    };
  }

  /**
   * Whether a pause touches the `days` days up to today. Summaries and
   * insights over such a stretch say nothing: a paused day is not judged
   * (MM-148).
   */
  private pauseWithin(days: number): boolean {
    const today = this.today.value;
    return pausedDaysBetween(of(this.pauses) ?? [], today.addDays(-days), today) > 0;
  }

  /** What was logged on `date`. */
  foodForDay(date: CalendarDate): Cell<Loadable<FoodEntry[]>> {
    let cell = this.foodByDay.get(date.epochDay);
    if (cell === undefined) {
      cell = stream(() => this.services.food.watchFood(date));
      this.foodByDay.set(date.epochDay, cell);
    }
    return cell;
  }

  /** The water logged on `date` (MM-313). */
  waterForDay(date: CalendarDate): Cell<Loadable<WaterEntry[]>> {
    let cell = this.waterByDay.get(date.epochDay);
    if (cell === undefined) {
      cell = stream(() => this.services.water.watchWater(date));
      this.waterByDay.set(date.epochDay, cell);
    }
    return cell;
  }

  /** Whether `date` was marked whole, partial or not at all. */
  completeness(date: CalendarDate): Cell<Loadable<DayCompleteness>> {
    let cell = this.completenessByDay.get(date.epochDay);
    if (cell === undefined) {
      cell = stream(() => this.services.dayMarks.watchCompleteness(date));
      this.completenessByDay.set(date.epochDay, cell);
    }
    return cell;
  }

  /**
   * Food for a whole report period, read from the log rather than the last
   * 60 days the engine uses, so an old report can be reread (MM-33).
   */
  private reportIntake(index: number): Cell<Loadable<IntakeDay[]>> {
    let cell = this.reportIntakeByIndex.get(index);
    if (cell === undefined) {
      cell = stream<IntakeDay[]>(() => {
        const period = this.reportPeriods.value[index];
        if (period === undefined) {
          return {
            subscribe: (listener) => {
              listener([]);
              return () => undefined;
            },
          };
        }
        return this.services.intake.watchIntakeDays({ since: period.from });
      });
      this.reportIntakeByIndex.set(index, cell);
    }
    return cell;
  }

  /**
   * One monthly report, built from stored history; undefined until it is
   * ready or while its data loads (MM-33).
   */
  monthlyReport(index: number): Cell<MonthlyReport | undefined> {
    let cell = this.reportByIndex.get(index);
    if (cell === undefined) {
      cell = derived(() => {
        const period = this.reportPeriods.value[index];
        const intake = of(this.reportIntake(index));
        const weights = of(this.weights);
        const waist = of(this.waist);
        const history = of(this.targetsHistory);
        const coach = this.coach.value;
        const workouts = of(this.workouts) ?? [];
        const exercises = this.exercises.value;
        if (
          period === undefined ||
          intake === undefined ||
          weights === undefined ||
          waist === undefined ||
          history === undefined
        ) {
          return undefined;
        }
        return buildMonthlyReport({
          period,
          intake,
          weights,
          waist,
          history,
          trend: coach?.trend ?? [],
          workouts,
          exercises,
          // Paused days neither count nor break the month's longest logging run (MM-92).
          pauses: of(this.pauses) ?? [],
          // As the app would recommend today: body fat then is not kept.
          recommendation: coach?.recommendation,
        });
      });
      this.reportByIndex.set(index, cell);
    }
    return cell;
  }
}
