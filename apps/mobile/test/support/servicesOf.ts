import type { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryReminderScheduler } from '../../src/fixtures/InMemoryReminderScheduler';
import type { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { InMemoryPackHttp } from '../../src/foodCatalog/download/InMemoryPackHttp';
import { InMemoryPackStore } from '../../src/foodCatalog/download/InMemoryPackStore';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { constant } from '../../src/lang/constant';
import { NoCamera } from '../../src/platform/NoCamera';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import type { AppServices } from '../../src/state/AppServices';

/** The stores `repos` holds, with `clock`, as the app takes them. */
export function servicesOf(repos: InMemoryRepositories, clock: FixedClock): AppServices {
  // Never the device's camera in a test, and no food pack unless the test brings one.
  const camera = new NoCamera();
  return {
    catalog: constant(new FoodCatalog([])),
    // Never the network in a test: nothing to fetch, and nowhere to fetch a list from.
    packStore: new InMemoryPackStore((bytes) => WasmSqlDatabase.open({ bytes })),
    packHttp: new InMemoryPackHttp(),
    packManifestUrl: '',
    barcodeScanner: camera,
    labelReader: camera,
    // Never the device's vibration in a test.
    restSignal: { restOver: () => undefined },
    // Never the device's notifications in a test.
    reminderScheduler: new InMemoryReminderScheduler(),
    // Never the device's health platform in a test: one with nothing in it, unless the test brings its own.
    healthSource: FakeHealthSource.fromJson('{"sources": [], "events": []}'),
    evidence: () => import('../../src/app/evidenceText').then((module) => module.evidenceText),
    environment: 'dev',
    clock,
    setup: repos.setup,
    weights: repos.weights,
    weightEvents: repos.weightEvents,
    waist: repos.waist,
    food: repos.food,
    customFoods: repos.customFoods,
    dayMarks: repos.dayMarks,
    intake: repos.intake,
    targets: repos.targets,
    preferences: repos.preferences,
    insightLog: repos.insightLog,
    pauses: repos.pauses,
    reminders: repos.reminders,
    recovery: repos.recovery,
    workouts: repos.workouts,
    customExercises: repos.customExercises,
    healthSamples: repos.healthSamples,
    exerciseProgressions: repos.exerciseProgressions,
    eraser: repos.eraser,
  };
}
