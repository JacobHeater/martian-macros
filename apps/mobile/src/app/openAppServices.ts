import { SqlRepositories } from '../data/SqlRepositories';
import { EraserWithPhotos } from '../data/EraserWithPhotos';
import { SqlProgressPhotoRepository } from '../data/SqlProgressPhotoRepository';
import { MediaDevicesPhotoCamera } from '../platform/MediaDevicesPhotoCamera';
import { NativeDeviceLock } from '../platform/NativeDeviceLock';
import { NativePrivateScreen } from '../platform/NativePrivateScreen';
import { NoPhotoLibrary } from '../platform/NoPhotoLibrary';
import { NoDeviceLock } from '../platform/NoDeviceLock';
import { NoPrivateScreen } from '../platform/NoPrivateScreen';
import { NativeBackupPlatform } from '../backup/NativeBackupPlatform';
import { openNativeSnapshot } from '../backup/openNativeSnapshot';
import { WasmBackupPlatform } from '../backup/WasmBackupPlatform';
import { mmBackup } from '../platform/mmBackup';
import { AppIdentity } from './AppIdentity';
import { databaseNameFor } from './databaseNameFor';
import { SystemClock } from '../domain/integration/SystemClock';
import { InMemoryPackHttp } from '../foodCatalog/download/InMemoryPackHttp';
import { InMemoryPackStore } from '../foodCatalog/download/InMemoryPackStore';
import { mmPacks } from '../foodCatalog/download/native/mmPacks';
import { NativePackFetch } from '../foodCatalog/download/native/NativePackFetch';
import { NativePackHttp } from '../foodCatalog/download/native/NativePackHttp';
import { NativePackStore } from '../foodCatalog/download/native/NativePackStore';
import { FoodCatalog } from '../foodCatalog/FoodCatalog';
import { SqlOnlineFoodCache } from '../foodCatalog/online/SqlOnlineFoodCache';
import { OpenFoodFactsSource } from '../foodOnline/OpenFoodFactsSource';
import { UsdaFoodDataCentralSource } from '../foodOnline/UsdaFoodDataCentralSource';
import { CapacitorJsonHttp } from '../platform/CapacitorJsonHttp';
import { constant } from '../lang/constant';
import { mmHealth } from '../platform/mmHealth';
import { mmReminders } from '../platform/mmReminders';
import { mmScanner } from '../platform/mmScanner';
import { NativeCamera } from '../platform/NativeCamera';
import { NativeExternalLinks } from '../platform/NativeExternalLinks';
import { NativeHealthProfile } from '../platform/NativeHealthProfile';
import { NativeHealthSource } from '../platform/NativeHealthSource';
import { NativeHealthWorkouts } from '../platform/NativeHealthWorkouts';
import { NativeHealthWriting } from '../platform/NativeHealthWriting';
import { NativeReminderScheduler } from '../platform/NativeReminderScheduler';
import { NativeExactAlarms } from '../platform/NativeExactAlarms';
import { NoExactAlarmPermission } from '../platform/NoExactAlarmPermission';
import { NoCamera } from '../platform/NoCamera';
import { runningNatively } from '../platform/runningNatively';
import { runningOn } from '../platform/runningOn';
import { NoHealthPlatform } from '../platform/NoHealthPlatform';
import { NoHealthProfile } from '../platform/NoHealthProfile';
import { NoHealthWorkouts } from '../platform/NoHealthWorkouts';
import { NoHealthWriting } from '../platform/NoHealthWriting';
import { MirroredFoodLog } from '../healthWrite/MirroredFoodLog';
import { MirroredWaterLog } from '../healthWrite/MirroredWaterLog';
import { MirroredWeightLog } from '../healthWrite/MirroredWeightLog';
import { MirroredWorkoutLog } from '../healthWrite/MirroredWorkoutLog';
import { RenewingEraser } from '../healthWrite/RenewingEraser';
import { RenewingRestorer } from '../healthWrite/RenewingRestorer';
import { NoNotifications } from '../platform/NoNotifications';
import { VibratingRestSignal } from '../platform/VibratingRestSignal';
import { NativeClipboard } from '../platform/NativeClipboard';
import { NativeMealShare } from '../platform/NativeMealShare';
import { NativePhotoLibrary } from '../platform/NativePhotoLibrary';
import { NavigatorClipboard } from '../platform/NavigatorClipboard';
import { NavigatorMealShare } from '../platform/NavigatorMealShare';
import { WindowExternalLinks } from '../platform/WindowExternalLinks';
import { mmDb } from '../sql/native/mmDb';
import { NativeSqlDatabase } from '../sql/native/NativeSqlDatabase';
import { WasmSqlDatabase } from '../sql/wasm/WasmSqlDatabase';
import { reminderPrompt } from '../format/reminderPrompt';
import type { AppServices } from '../state/AppServices';
import { installedCatalog } from '../state/installedCatalog';

/**
 * The one place the app chooses where things are stored (MM-162, MM-231).
 *
 * Inside the native shell, the database and downloaded packs live on the
 * phone's own storage and outlive the app. In a browser (the dev server;
 * the test runner) everything is held in memory and **nothing is kept when
 * the page closes**: the web is never a product (MM-228).
 */
export async function openAppServices(): Promise<AppServices> {
  const native = runningNatively();
  // The database is named for the identity the shell has (MM-8): the demo's
  // keeps the name it always had, so a seed can never touch another's.
  const databaseName = databaseNameFor(AppIdentity.of(__MM_IDENTITY__));
  const sql = native ? await NativeSqlDatabase.open({ name: databaseName }, mmDb) : await WasmSqlDatabase.open();
  // A backup is the phone's copy of that database, encrypted before it leaves (MM-63); a restore opens a copy brought back.
  const repositories = await SqlRepositories.open(sql, native ? { openSnapshot: openNativeSnapshot({ api: mmBackup, db: mmDb }) } : {});
  // The progress photos are a database file of their own (MM-157), so the user's database, and its snapshot for a
  // backup, never holds one; a browser keeps them in memory.
  const progressPhotos = await SqlProgressPhotoRepository.open(
    native ? await NativeSqlDatabase.open({ name: `${databaseName}-photos` }, mmDb) : await WasmSqlDatabase.open(),
  );
  const backup = sql instanceof WasmSqlDatabase ? new WasmBackupPlatform(sql) : new NativeBackupPlatform({ api: mmBackup, databaseName });
  const packStore = native
    ? new NativePackStore({ api: mmPacks, db: mmDb })
    : new InMemoryPackStore((bytes) => WasmSqlDatabase.open({ bytes }));
  const camera = native ? new NativeCamera(mmScanner) : new NoCamera();
  const onlineHttp = new CapacitorJsonHttp();
  const onlineFoods = new SqlOnlineFoodCache(sql);
  const platform = runningOn();
  // What is logged is written to the health platform only for the kinds turned on in Settings (MM-70, MM-314,
  // MM-513, MM-489); the plugin keeps which those are. Health Connect names a workout's exercises, Apple Health does not.
  const healthWriting = native ? new NativeHealthWriting(mmHealth) : new NoHealthWriting();
  const healthWorkouts = native
    ? new NativeHealthWorkouts({ api: mmHealth, namesExercises: platform === 'android' })
    : new NoHealthWorkouts();
  // One clock for the app and the adapters that count time (MM-190).
  const clock = new SystemClock();
  return {
    clock,
    setup: repositories.setup,
    // Only a weigh-in typed in the app passes through here; one read from the platform never does (MM-513).
    weights: new MirroredWeightLog({ log: repositories.weights, platform: healthWriting, clock }),
    weightEvents: repositories.weightEvents,
    waist: repositories.waist,
    measurements: repositories.measurements,
    measurementSettings: repositories.measurementSettings,
    flowDays: repositories.flowDays,
    sleep: repositories.sleep,
    water: new MirroredWaterLog({ log: repositories.water, platform: healthWriting }),
    food: new MirroredFoodLog({ log: repositories.food, platform: healthWriting }),
    customFoods: repositories.customFoods,
    dayMarks: repositories.dayMarks,
    dayKinds: repositories.dayKinds,
    intake: repositories.intake,
    targets: repositories.targets,
    targetShapes: repositories.targetShapes,
    goalBodyFat: repositories.goalBodyFat,
    preferences: repositories.preferences,
    weighInWindow: repositories.weighInWindow,
    insightLog: repositories.insightLog,
    inlineInsightLog: repositories.inlineInsightLog,
    insightSnoozes: repositories.insightSnoozes,
    trendLog: repositories.trendLog,
    adviceRecord: repositories.adviceRecord,
    pauses: repositories.pauses,
    reminders: repositories.reminders,
    recovery: repositories.recovery,
    workouts: new MirroredWorkoutLog({
      log: repositories.workouts,
      platform: healthWorkouts,
      customExercises: repositories.customExercises,
      ids: healthWriting,
    }),
    customExercises: repositories.customExercises,
    healthSamples: repositories.healthSamples,
    exerciseProgressions: repositories.exerciseProgressions,
    // Erasing or restoring starts entry ids again: a new write namespace keeps new writes from replacing old ones (MM-522).
    // Erasing all data erases the photos too (MM-157).
    eraser: new RenewingEraser({ eraser: new EraserWithPhotos({ eraser: repositories.eraser, photos: progressPhotos }), ids: healthWriting }),
    restorer: new RenewingRestorer({ restorer: repositories.restorer, ids: healthWriting }),
    backup,
    // The packs on this phone as one catalog, read again on each
    // subscription, which the app asks for when one is installed or
    // removed; the catalog it replaces is closed (MM-386). A browser has none. No camera plugin is in the shell yet
    // (MM-232, step 5).
    catalog: native ? installedCatalog(packStore, [onlineFoods]) : constant(new FoodCatalog([onlineFoods])),
    packStore,
    packHttp: native ? new NativePackHttp(mmPacks) : new InMemoryPackHttp(),
    // A pack file goes from the connection into its file natively, and only its count reaches the app (MM-387).
    // A browser reads it through `packHttp` into `packStore` instead.
    packFetch: native ? new NativePackFetch(mmPacks) : undefined,
    // Where to read the list of packs on offer, set for each build (MM-56).
    // A browser build offers no downloads and makes no request.
    packManifestUrl: native ? __MM_FOOD_PACK_MANIFEST_URL__ : '',
    // The services an unknown food may be looked up at, only when the person allows it (MM-58): Open Food
    // Facts needs no key; FoodData Central only when the build was given one. A browser has them too, so the
    // dev server can be tried, but a story or a test never (fixtureServices).
    onlineSources: [
      new OpenFoodFactsSource({ http: onlineHttp }),
      ...(__MM_FDC_API_KEY__ === '' ? [] : [new UsdaFoodDataCentralSource({ http: onlineHttp, apiKey: __MM_FDC_API_KEY__ })]),
    ],
    onlineFoods,
    barcodeScanner: camera,
    labelReader: camera,
    restSignal: new VibratingRestSignal(),
    // A link the person presses opens in the phone's browser (MM-454); in a browser, in a new tab.
    externalLinks: native ? new NativeExternalLinks(mmBackup) : new WindowExternalLinks(),
    // The phone's clipboard through the shell, since Android's WebView cannot read it (MM-590); in a browser, the page's.
    clipboard: native ? new NativeClipboard(mmBackup) : new NavigatorClipboard(),
    // A meal's photos chosen and handed to the person's assistant with its prompt, never kept (MM-599); in a browser,
    // the camera only, and the browser's share where it can share files.
    photoLibrary: native ? new NativePhotoLibrary(mmBackup) : new NoPhotoLibrary(),
    mealShare: native ? new NativeMealShare(mmBackup) : new NavigatorMealShare(),
    reminderScheduler: native
      ? new NativeReminderScheduler({ api: mmReminders, prompt: reminderPrompt })
      : new NoNotifications(),
    exactAlarms: native ? new NativeExactAlarms(mmReminders) : new NoExactAlarmPermission(),
    // Only Health Connect has a screen of the app's permissions to open (MM-323).
    healthSource: native
      ? new NativeHealthSource(mmHealth, clock, { opensPermissions: platform === 'android' })
      : new NoHealthPlatform(),
    healthWriting,
    healthWorkouts,
    progressPhotos,
    // Photos are taken inside the app, through the web view's camera, never the phone's camera app (MM-157).
    photoCamera: new MediaDevicesPhotoCamera(),
    deviceLock: native ? new NativeDeviceLock(mmBackup) : new NoDeviceLock(),
    privateScreen: native ? new NativePrivateScreen(mmBackup) : new NoPrivateScreen(),
    // Only Apple Health keeps a sex and a date of birth to fill onboarding in from (MM-69).
    healthProfile: native && platform === 'ios' ? new NativeHealthProfile(mmHealth) : new NoHealthProfile(),
    evidence: () => import('./evidenceText').then((module) => module.evidenceText),
    environment: import.meta.env.DEV ? 'dev' : 'prod',
    platform,
  };
}
