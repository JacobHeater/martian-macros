import { SqlRepositories } from '../data/SqlRepositories';
import { SystemClock } from '../domain/integration/SystemClock';
import { InMemoryPackHttp } from '../foodCatalog/download/InMemoryPackHttp';
import { InMemoryPackStore } from '../foodCatalog/download/InMemoryPackStore';
import { mmPacks } from '../foodCatalog/download/native/mmPacks';
import { NativePackHttp } from '../foodCatalog/download/native/NativePackHttp';
import { NativePackStore } from '../foodCatalog/download/native/NativePackStore';
import { openInstalledCatalog } from '../foodCatalog/download/openInstalledCatalog';
import { FoodCatalog } from '../foodCatalog/FoodCatalog';
import { constant } from '../lang/constant';
import { mmHealth } from '../platform/mmHealth';
import { mmReminders } from '../platform/mmReminders';
import { mmScanner } from '../platform/mmScanner';
import { NativeCamera } from '../platform/NativeCamera';
import { NativeHealthSource } from '../platform/NativeHealthSource';
import { NativeReminderScheduler } from '../platform/NativeReminderScheduler';
import { NoCamera } from '../platform/NoCamera';
import { runningNatively } from '../platform/runningNatively';
import { NoHealthPlatform } from '../platform/NoHealthPlatform';
import { NoNotifications } from '../platform/NoNotifications';
import { VibratingRestSignal } from '../platform/VibratingRestSignal';
import { mmDb } from '../sql/native/mmDb';
import { NativeSqlDatabase } from '../sql/native/NativeSqlDatabase';
import { WasmSqlDatabase } from '../sql/wasm/WasmSqlDatabase';
import { reminderPrompt } from '../format/reminderPrompt';
import type { AppServices } from '../state/AppServices';
import { once } from '../state/once';

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
  // This shell is only ever the demo identity until the switch (MM-228),
  // so its database carries the name the Flutter demo used.
  const repositories = await SqlRepositories.open(
    native ? await NativeSqlDatabase.open({ name: 'martian_macros_demo' }, mmDb) : await WasmSqlDatabase.open(),
  );
  const packStore = native
    ? new NativePackStore({ api: mmPacks, db: mmDb })
    : new InMemoryPackStore((bytes) => WasmSqlDatabase.open({ bytes }));
  const camera = native ? new NativeCamera(mmScanner) : new NoCamera();
  return {
    clock: new SystemClock(),
    setup: repositories.setup,
    weights: repositories.weights,
    weightEvents: repositories.weightEvents,
    waist: repositories.waist,
    water: repositories.water,
    food: repositories.food,
    customFoods: repositories.customFoods,
    dayMarks: repositories.dayMarks,
    intake: repositories.intake,
    targets: repositories.targets,
    preferences: repositories.preferences,
    insightLog: repositories.insightLog,
    pauses: repositories.pauses,
    reminders: repositories.reminders,
    recovery: repositories.recovery,
    workouts: repositories.workouts,
    customExercises: repositories.customExercises,
    healthSamples: repositories.healthSamples,
    exerciseProgressions: repositories.exerciseProgressions,
    eraser: repositories.eraser,
    // The packs on this phone as one catalog, read again on each
    // subscription, which the app asks for when one is installed or
    // removed. A browser has none. No camera plugin is in the shell yet
    // (MM-232, step 5).
    catalog: native ? once(() => openInstalledCatalog(packStore)) : constant(new FoodCatalog([])),
    packStore,
    packHttp: native ? new NativePackHttp(mmPacks) : new InMemoryPackHttp(),
    // Where to read the list of packs on offer, set for each build (MM-56).
    // A browser build offers no downloads and makes no request.
    packManifestUrl: native ? __MM_FOOD_PACK_MANIFEST_URL__ : '',
    barcodeScanner: camera,
    labelReader: camera,
    restSignal: new VibratingRestSignal(),
    reminderScheduler: native
      ? new NativeReminderScheduler({ api: mmReminders, prompt: reminderPrompt })
      : new NoNotifications(),
    healthSource: native ? new NativeHealthSource(mmHealth) : new NoHealthPlatform(),
    evidence: () => import('./evidenceText').then((module) => module.evidenceText),
    environment: import.meta.env.DEV ? 'dev' : 'prod',
  };
}
