import type { FixedClock } from '../fixtures/FixedClock';
import { InMemoryReminderScheduler } from '../fixtures/InMemoryReminderScheduler';
import type { InMemoryRepositories } from '../fixtures/InMemoryRepositories';
import { InMemoryPackHttp } from '../foodCatalog/download/InMemoryPackHttp';
import { InMemoryPackStore } from '../foodCatalog/download/InMemoryPackStore';
import { FoodCatalog } from '../foodCatalog/FoodCatalog';
import { InMemoryOnlineFoodCache } from '../foodCatalog/online/InMemoryOnlineFoodCache';
import { FakeBackupPlatform } from '../backup/FakeBackupPlatform';
import { FakeDataRestorer } from '../fixtures/FakeDataRestorer';
import { FakeHealthSource } from '../healthIngest/testing/FakeHealthSource';
import { constant } from '../lang/constant';
import { NoCamera } from '../platform/NoCamera';
import { WasmSqlDatabase } from '../sql/wasm/WasmSqlDatabase';
import type { AppServices } from '../state/AppServices';

/**
 * The stores `repos` holds, with `clock`, as the app takes them, and
 * nothing of the device or the network: what a test and a story both draw
 * the app over.
 */
export function fixtureServices(repos: InMemoryRepositories, clock: FixedClock): AppServices {
  // Never the device's camera, and no food pack unless one is brought.
  const camera = new NoCamera();
  const onlineFoods = new InMemoryOnlineFoodCache();
  return {
    catalog: constant(new FoodCatalog([onlineFoods])),
    // Never a web service: no source to ask, unless a story or a test brings one (MM-58).
    onlineSources: [],
    onlineFoods,
    // Never the network: nothing to fetch, and nowhere to fetch a list from.
    packStore: new InMemoryPackStore((bytes) => WasmSqlDatabase.open({ bytes })),
    packHttp: new InMemoryPackHttp(),
    packManifestUrl: '',
    barcodeScanner: camera,
    labelReader: camera,
    // Never the device's vibration.
    restSignal: { restOver: () => undefined },
    // Never the device's notifications.
    reminderScheduler: new InMemoryReminderScheduler(),
    // Never the device's health platform: one with nothing in it, unless another is brought.
    healthSource: FakeHealthSource.fromJson('{"sources": [], "events": []}'),
    evidence: () => import('../app/evidenceText').then((module) => module.evidenceText),
    environment: 'dev',
    // The app as on an Android phone, unless a story or a test is about an iPhone (`onIos`, MM-403).
    platform: 'android',
    clock,
    setup: repos.setup,
    weights: repos.weights,
    weightEvents: repos.weightEvents,
    water: repos.water,
    waist: repos.waist,
    flowDays: repos.flowDays,
    sleep: repos.sleep,
    food: repos.food,
    customFoods: repos.customFoods,
    dayMarks: repos.dayMarks,
    intake: repos.intake,
    targets: repos.targets,
    preferences: repos.preferences,
    insightLog: repos.insightLog,
    inlineInsightLog: repos.inlineInsightLog,
    insightSnoozes: repos.insightSnoozes,
    pauses: repos.pauses,
    reminders: repos.reminders,
    recovery: repos.recovery,
    workouts: repos.workouts,
    customExercises: repos.customExercises,
    healthSamples: repos.healthSamples,
    exerciseProgressions: repos.exerciseProgressions,
    eraser: repos.eraser,
    // No real backup: a fake that keeps what is saved and gives what a test put there (MM-63).
    restorer: new FakeDataRestorer(),
    backup: new FakeBackupPlatform(),
  };
}
