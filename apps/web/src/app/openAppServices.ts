import { SqlRepositories } from '../data/SqlRepositories';
import { SystemClock } from '../domain/integration/SystemClock';
import { FoodCatalog } from '../foodCatalog/FoodCatalog';
import { constant } from '../lang/constant';
import { NoCamera } from '../platform/NoCamera';
import { VibratingRestSignal } from '../platform/VibratingRestSignal';
import { WasmSqlDatabase } from '../sql/wasm/WasmSqlDatabase';
import type { AppServices } from '../state/AppServices';

/**
 * The one place the app chooses where things are stored (MM-162, MM-231).
 *
 * For now that is a database in memory, on the phone as in a browser:
 * **nothing is kept when the app closes.** The database on the phone's own
 * storage is the native adapter, which is not built yet (MM-231).
 */
export async function openAppServices(): Promise<AppServices> {
  const repositories = await SqlRepositories.open(await WasmSqlDatabase.open());
  const camera = new NoCamera();
  return {
    clock: new SystemClock(),
    setup: repositories.setup,
    weights: repositories.weights,
    weightEvents: repositories.weightEvents,
    waist: repositories.waist,
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
    // No pack can be installed yet, and no camera plugin is in the shell (MM-232, step 5).
    catalog: constant(new FoodCatalog([])),
    barcodeScanner: camera,
    labelReader: camera,
    restSignal: new VibratingRestSignal(),
  };
}
