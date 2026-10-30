import { FixturePhotoCamera } from '../fixtures/FixturePhotoCamera';
import { InMemoryDeviceLock } from '../fixtures/InMemoryDeviceLock';
import { InMemoryPrivateScreen } from '../fixtures/InMemoryPrivateScreen';
import type { FixedClock } from '../fixtures/FixedClock';
import { InMemoryReminderScheduler } from '../fixtures/InMemoryReminderScheduler';
import { InMemoryExactAlarms } from '../fixtures/InMemoryExactAlarms';
import { InMemoryHealthWorkouts } from '../fixtures/InMemoryHealthWorkouts';
import { InMemoryHealthWriting } from '../fixtures/InMemoryHealthWriting';
import type { InMemoryRepositories } from '../fixtures/InMemoryRepositories';
import { InMemoryPackHttp } from '../foodCatalog/download/InMemoryPackHttp';
import { InMemoryPackStore } from '../foodCatalog/download/InMemoryPackStore';
import { FoodCatalog } from '../foodCatalog/FoodCatalog';
import { InMemoryOnlineFoodCache } from '../foodCatalog/online/InMemoryOnlineFoodCache';
import { FakeBackupPlatform } from '../backup/FakeBackupPlatform';
import { FakeMoveReceiver } from '../transfer/FakeMoveReceiver';
import { FakeMoveSender } from '../transfer/FakeMoveSender';
import { FakeDataRestorer } from '../fixtures/FakeDataRestorer';
import { InMemoryClipboard } from '../fixtures/InMemoryClipboard';
import { InMemoryCoachAiStore } from '../fixtures/InMemoryCoachAiStore';
import { InMemoryCoachNarrator } from '../fixtures/InMemoryCoachNarrator';
import { InMemoryHaptics } from '../fixtures/InMemoryHaptics';
import { InMemoryMealShare } from '../fixtures/InMemoryMealShare';
import { InMemoryPhotoLibrary } from '../fixtures/InMemoryPhotoLibrary';
import { InMemoryExternalLinks } from '../fixtures/InMemoryExternalLinks';
import { FakeHealthSource } from '../healthIngest/testing/FakeHealthSource';
import { constant } from '../lang/constant';
import { NoCamera } from '../platform/NoCamera';
import { NoHealthProfile } from '../platform/NoHealthProfile';
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
    codeScanner: camera,
    // Never the device's vibration.
    restSignal: { restOver: () => undefined },
    haptics: new InMemoryHaptics(),
    // Never the device's browser: a link pressed is only kept (MM-454).
    externalLinks: new InMemoryExternalLinks(),
    // Never the device's clipboard: what is copied is only kept (MM-586).
    clipboard: new InMemoryClipboard(),
    // Never the phone's picker or share sheet: photos are fixtures, and what is sent is only kept (MM-599).
    photoLibrary: new InMemoryPhotoLibrary(),
    mealShare: new InMemoryMealShare(),
    coachAi: new InMemoryCoachAiStore(),
    coachNarrator: new InMemoryCoachNarrator(),
    // Never the device's notifications.
    reminderScheduler: new InMemoryReminderScheduler(),
    // Exact alarms allowed, unless a story or a test is about asking (MM-248).
    exactAlarms: new InMemoryExactAlarms(),
    // Never the device's health platform: one with nothing in it, unless another is brought.
    healthSource: FakeHealthSource.fromJson('{"sources": [], "events": []}'),
    // Nothing is written to it unless a story or a test turns a kind on (MM-70).
    healthWriting: new InMemoryHealthWriting(),
    healthWorkouts: new InMemoryHealthWorkouts({ namesExercises: true }),
    // Never the device's camera or lock: a camera whose every photo is the fixture, a lock that opens (MM-157).
    progressPhotos: repos.progressPhotos,
    photoCamera: new FixturePhotoCamera(),
    deviceLock: new InMemoryDeviceLock(),
    privateScreen: new InMemoryPrivateScreen(),
    // Onboarding offers no platform to fill in from, unless a story or a test brings Apple Health (MM-69).
    healthProfile: new NoHealthProfile(),
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
    measurements: repos.measurements,
    measurementSettings: repos.measurementSettings,
    flowDays: repos.flowDays,
    sleep: repos.sleep,
    food: repos.food,
    customFoods: repos.customFoods,
    savedMeals: repos.savedMeals,
    dayMarks: repos.dayMarks,
    dayKinds: repos.dayKinds,
    intake: repos.intake,
    targets: repos.targets,
    targetShapes: repos.targetShapes,
    goalBodyFat: repos.goalBodyFat,
    preferences: repos.preferences,
    weighInWindow: repos.weighInWindow,
    insightLog: repos.insightLog,
    inlineInsightLog: repos.inlineInsightLog,
    insightSnoozes: repos.insightSnoozes,
    trendLog: repos.trendLog,
    adviceRecord: repos.adviceRecord,
    pauses: repos.pauses,
    reminders: repos.reminders,
    recovery: repos.recovery,
    workouts: repos.workouts,
    customExercises: repos.customExercises,
    cardioSessions: repos.cardioSessions,
    dailySteps: repos.dailySteps,
    healthSamples: repos.healthSamples,
    exerciseProgressions: repos.exerciseProgressions,
    eraser: repos.eraser,
    // No real backup: a fake that keeps what is saved and gives what a test put there (MM-63).
    restorer: new FakeDataRestorer(),
    backup: new FakeBackupPlatform(),
    // Never the network: a phone that waits for a code to be scanned, and one that sends at once (MM-695).
    moveReceiver: new FakeMoveReceiver(),
    moveSender: new FakeMoveSender(),
    moveIdentity: async () => ({ app: '1.0 (1)', schema: 1 }),
  };
}
