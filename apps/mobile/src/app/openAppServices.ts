import { SqlRepositories } from '../data/SqlRepositories';
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
import { NativeHealthSource } from '../platform/NativeHealthSource';
import { NativeReminderScheduler } from '../platform/NativeReminderScheduler';
import { NativeExactAlarms } from '../platform/NativeExactAlarms';
import { NoExactAlarmPermission } from '../platform/NoExactAlarmPermission';
import { NoCamera } from '../platform/NoCamera';
import { runningNatively } from '../platform/runningNatively';
import { runningOn } from '../platform/runningOn';
import { NoHealthPlatform } from '../platform/NoHealthPlatform';
import { NoNotifications } from '../platform/NoNotifications';
import { VibratingRestSignal } from '../platform/VibratingRestSignal';
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
  const backup = sql instanceof WasmSqlDatabase ? new WasmBackupPlatform(sql) : new NativeBackupPlatform({ api: mmBackup, databaseName });
  const packStore = native
    ? new NativePackStore({ api: mmPacks, db: mmDb })
    : new InMemoryPackStore((bytes) => WasmSqlDatabase.open({ bytes }));
  const camera = native ? new NativeCamera(mmScanner) : new NoCamera();
  const onlineHttp = new CapacitorJsonHttp();
  const onlineFoods = new SqlOnlineFoodCache(sql);
  return {
    clock: new SystemClock(),
    setup: repositories.setup,
    weights: repositories.weights,
    weightEvents: repositories.weightEvents,
    waist: repositories.waist,
    flowDays: repositories.flowDays,
    sleep: repositories.sleep,
    water: repositories.water,
    food: repositories.food,
    customFoods: repositories.customFoods,
    dayMarks: repositories.dayMarks,
    intake: repositories.intake,
    targets: repositories.targets,
    targetShapes: repositories.targetShapes,
    preferences: repositories.preferences,
    insightLog: repositories.insightLog,
    inlineInsightLog: repositories.inlineInsightLog,
    insightSnoozes: repositories.insightSnoozes,
    pauses: repositories.pauses,
    reminders: repositories.reminders,
    recovery: repositories.recovery,
    workouts: repositories.workouts,
    customExercises: repositories.customExercises,
    healthSamples: repositories.healthSamples,
    exerciseProgressions: repositories.exerciseProgressions,
    eraser: repositories.eraser,
    restorer: repositories.restorer,
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
    reminderScheduler: native
      ? new NativeReminderScheduler({ api: mmReminders, prompt: reminderPrompt })
      : new NoNotifications(),
    exactAlarms: native ? new NativeExactAlarms(mmReminders) : new NoExactAlarmPermission(),
    healthSource: native ? new NativeHealthSource(mmHealth) : new NoHealthPlatform(),
    evidence: () => import('./evidenceText').then((module) => module.evidenceText),
    environment: import.meta.env.DEV ? 'dev' : 'prod',
    platform: runningOn(),
  };
}
