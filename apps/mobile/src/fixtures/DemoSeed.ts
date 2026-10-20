import type { CalendarDate } from '../domain/CalendarDate';
import { Micronutrients } from '../domain/food/micros/Micronutrients';
import type { Portion } from '../domain/food/portion/Portion';
import { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { SleepNight } from '../domain/SleepNight';
import type { DataEraser } from '../domain/repositories/DataEraser';
import type { DayMarkWriter } from '../domain/repositories/DayMarkWriter';
import type { FoodEntryWriter } from '../domain/repositories/FoodEntryWriter';
import type { RecoveryCheckInWriter } from '../domain/repositories/RecoveryCheckInWriter';
import type { SetupWriter } from '../domain/repositories/SetupWriter';
import type { SleepWriter } from '../domain/repositories/SleepWriter';
import type { WaistWriter } from '../domain/repositories/WaistWriter';
import type { WaterWriter } from '../domain/repositories/WaterWriter';
import type { WeightWriter } from '../domain/repositories/WeightWriter';
import type { WorkoutWriter } from '../domain/repositories/WorkoutWriter';
import { Workout } from '../domain/training/Workout';
import { WaterEntry } from '../domain/water/WaterEntry';
import { WorkoutExercise } from '../domain/training/WorkoutExercise';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { DailyTargets } from '../engine/DailyTargets';
import type { TargetsHistoryWriter } from '../engine/TargetsHistoryWriter';
import { TargetsRecord } from '../engine/TargetsRecord';
import { typicalSetup } from './typicalSetup';

type DemoMeal = readonly [meal: Meal, name: string, protein: number, carbs: number, fat: number, fiber: number, portion: Portion];

/**
 * How each demo meal was measured (MM-289): a different method for each, so
 * the Food screen shows the method icons of MM-255 beside their words, and
 * the same mix every day, so the estimator never reads a change in logging
 * style. The estimate has no amount, as an estimate does not.
 */
const aCup: Portion = { method: 'householdMeasure', basis: 'calculated', quantity: 1, unit: 'cup' };
const weighedGrams = (grams: number): Portion => ({ method: 'weighed', basis: 'calculated', quantity: grams, unit: 'gram' });
const twoPalms: Portion = { method: 'palm', basis: 'calculated', quantity: 2, unit: 'palm', impliedGrams: 240, handModelVersion: 1 };
const aServing: Portion = { method: 'labelServing', basis: 'calculated', quantity: 1, unit: 'serving' };
const estimated: Portion = { method: 'quickAdd', basis: 'enteredTotals' };

const breakfast: DemoMeal = ['breakfast', 'Demo oats and yogurt', 40, 65, 18, 8, aCup];
/** This morning's coffee, estimated (MM-289): a third method on the partly logged day, beside the cup and the label serving. */
const coffee: DemoMeal = ['snack', 'Demo coffee with milk', 3, 5, 3, 0, estimated];

/**
 * What each demo meal states beyond the macros (MM-308). The snack states
 * fewer, as a label often does, so the Micros view shows partial coverage.
 */
const microsOf: Readonly<Record<string, Micronutrients>> = {
  'Demo oats and yogurt': new Micronutrients({
    potassium: 650, calcium: 380, iron: 3.5, magnesium: 120, zinc: 2.5, vitaminA: 120, vitaminC: 2,
    vitaminD: 2.5, vitaminB12: 1.2, folate: 60, sugars: 22, saturatedFat: 6, cholesterol: 25,
  }),
  'Demo chicken and rice': new Micronutrients({
    potassium: 700, calcium: 60, iron: 2.8, magnesium: 80, zinc: 3.5, vitaminA: 40, vitaminC: 8,
    vitaminD: 0.3, vitaminB12: 0.6, folate: 45, sugars: 3, saturatedFat: 4, cholesterol: 120,
  }),
  'Demo tofu and potatoes': new Micronutrients({
    potassium: 1100, calcium: 450, iron: 5.5, magnesium: 140, zinc: 2.8, vitaminA: 300, vitaminC: 30,
    vitaminD: 0, vitaminB12: 0, folate: 90, sugars: 6, saturatedFat: 5, cholesterol: 0,
  }),
  'Demo fruit and nuts': new Micronutrients({
    potassium: 450, calcium: 60, iron: 1.5, magnesium: 90, zinc: 1.2, vitaminC: 25, sugars: 18, saturatedFat: 2,
  }),
  'Demo coffee with milk': new Micronutrients({ potassium: 120, calcium: 90, vitaminB12: 0.3, sugars: 4, saturatedFat: 2 }),
};

/** The demo's water on a day: a bottle in the morning and glasses after (MM-313). */
const waterOf = (partial: boolean): readonly (readonly [hour: number, ml: number])[] =>
  partial ? [[8, 500], [10, 250]] : [[8, 500], [10, 250], [13, 250], [16, 500], [19, 250]];
const snack: DemoMeal = ['snack', 'Demo fruit and nuts', 15, 25, 10, 5, aServing];
const restOfTheDay: readonly DemoMeal[] = [
  ['lunch', 'Demo chicken and rice', 55, 90, 22, 6, weighedGrams(350)],
  ['dinner', 'Demo tofu and potatoes', 50, 80, 25, 10, twoPalms],
  snack,
];
/** Today so far: breakfast, a coffee and the snack, three methods among them (MM-289). */
const thisMorning: readonly DemoMeal[] = [breakfast, coffee, snack];

/** A workout's lifts step up every third week (MM-289), so a record is set one week in three, not every week. */
const stepWeeks = 3;

const minuteMs = 60_000;

/**
 * Deterministic synthetic observations, relative to a local calendar day.
 * The caller must select an isolated demo store before allowing a reset.
 */
export class DemoSeed {
  static readonly historyDays = 70;

  readonly today: CalendarDate;

  constructor(today: CalendarDate) {
    this.today = today;
  }

  async replace({
    eraser,
    setup,
    weights,
    waist,
    food,
    dayMarks,
    targets,
    recovery,
    workouts,
    water,
    sleep,
  }: {
    eraser: DataEraser;
    setup: SetupWriter;
    weights: WeightWriter;
    waist?: WaistWriter | undefined;
    food: FoodEntryWriter;
    dayMarks: DayMarkWriter;
    targets: TargetsHistoryWriter;
    recovery: RecoveryCheckInWriter;
    workouts?: WorkoutWriter | undefined;
    water?: WaterWriter | undefined;
    sleep?: SleepWriter | undefined;
  }): Promise<void> {
    await eraser.eraseAll();
    const start = this.today.addDays(-DemoSeed.historyDays);
    await setup.saveSetup(typicalSetup({ onboardedOn: start, healthCheckConfirmedOn: this.today }));
    for (let i = 0; i <= DemoSeed.historyDays; i++) {
      const date = start.addDays(i);
      await weights.saveWeight(date, 86 - i * 0.035 + Math.sin(i * 1.7) * 0.35);
      // Most nights typed, around seven hours, one in five left unrecorded (MM-250).
      if (sleep !== undefined && i % 5 !== 2) {
        await sleep.saveSleepNight(new SleepNight({ date, minutesAsleep: 400 + ((i * 37) % 60), source: 'typed' }));
      }
      if (i % 7 === 0) {
        const week = Math.trunc(i / 7);
        const fourWeeks = Math.trunc(i / 28);
        if (waist !== undefined) await waist.saveWaist(date, 94 - i * 0.045);
        await recovery.saveRecoveryCheckIn(
          new RecoveryCheckIn({
            date,
            hunger: 3 + (week % 2),
            energy: 4,
            sleep: 3 + (week % 2),
            training: 4,
            mood: 4,
            sleepHours: 7.0 + (week % 3) * 0.25,
          }),
        );
        const kcal = 2300.0 - fourWeeks * 50;
        await targets.saveTargets(
          new TargetsRecord({
            effectiveFrom: date,
            targets: new DailyTargets({
              kcal,
              proteinG: 160,
              proteinMinimumG: 140,
              fatG: 70,
              carbsG: (kcal - 160 * 4 - 70 * 9) / 4,
              weeklyRateFraction: -0.003,
            }),
            mode: 'fatLoss',
            tdeeKcal: 2600 - fourWeeks * 30,
            tdeeSigmaKcal: 160,
            tdeeStatus: i < 28 ? 'held' : 'updated',
            safetyBodyFatPercent: 24,
          }),
        );
      }
      const partial = i === DemoSeed.historyDays;
      await dayMarks.setCompleteness(date, partial ? 'partial' : 'complete');
      const variation = ((i % 5) - 2) * 8.0;
      for (const [meal, name, protein, carbs, fat, fiber, portion] of partial ? thisMorning : [breakfast, ...restOfTheDay]) {
        const adjustedCarbs = carbs + variation / 4;
        await food.addFood(
          new FoodEntry({
            id: 0,
            date,
            meal,
            name,
            kcal: protein * 4 + adjustedCarbs * 4 + fat * 9,
            proteinG: protein,
            carbsG: adjustedCarbs,
            fatG: fat,
            fiberG: fiber,
            sodiumMg: 350,
            micros: microsOf[name],
            source: portion.method,
            portion,
          }),
        );
      }
    }
    if (water !== undefined) {
      // The last two weeks of water, today's morning included.
      for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
        const date = this.today.addDays(-daysAgo);
        for (const [hour, ml] of waterOf(daysAgo === 0)) {
          await water.addWater(
            new WaterEntry({ id: 0, date, ml, at: new Date(date.year, date.month - 1, date.day, hour) }),
          );
        }
      }
    }
    if (workouts !== undefined) {
      for (let daysAgo = 98; daysAgo >= 0; daysAgo -= 7) {
        const date = this.today.addDays(-daysAgo);
        const startedAt = new Date(date.year, date.month - 1, date.day, 18);
        const week = (98 - daysAgo) / 7;
        // The loads step up every third week, today's among them; between steps the same load is lifted
        // for fewer reps, so the week of a step is a record and the two after it are not (MM-289).
        const steps = Math.trunc((week + 1) / stepWeeks);
        const stepWeek = (week + 1) % stepWeeks === 0;
        const lifts: readonly (readonly [id: string, load: number])[] = [
          ['barbell-bench-press', 70.0 + steps * 2.5],
          ['back-squat', 95.0 + steps * 5],
          ['barbell-row', 55.0 + steps * 2.5],
          ['pull-up', week < 7 ? -10.0 : 0.0],
        ];
        // A step week is a longer session with a third set; the others differ in length too.
        const sets = (loadKg: number) =>
          stepWeek
            ? [new WorkoutSet({ reps: 6, loadKg, rir: 2 }), new WorkoutSet({ reps: 5, loadKg, rir: 1 }), new WorkoutSet({ reps: 5, loadKg, rir: 0 })]
            : [new WorkoutSet({ reps: 5, loadKg, rir: 2 }), new WorkoutSet({ reps: 4, loadKg, rir: 1 })];
        const minutes = stepWeek ? 65 : 45 + (week % stepWeeks) * 5;
        await workouts.saveWorkout(
          new Workout({
            id: 0,
            date,
            startedAt,
            endedAt: new Date(startedAt.getTime() + minutes * minuteMs),
            exercises: [
              ...lifts.map(([exerciseId, loadKg]) => new WorkoutExercise({ exerciseId, sets: sets(loadKg) })),
              new WorkoutExercise({
                exerciseId: 'dumbbell-lateral-raise',
                sets: [new WorkoutSet({ reps: 20, loadKg: 8 })],
              }),
            ],
          }),
        );
      }
    }
  }
}
