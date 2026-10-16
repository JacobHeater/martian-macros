import type { CalendarDate } from '../domain/CalendarDate';
import { Micronutrients } from '../domain/food/micros/Micronutrients';
import { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import type { DataEraser } from '../domain/repositories/DataEraser';
import type { DayMarkWriter } from '../domain/repositories/DayMarkWriter';
import type { FoodEntryWriter } from '../domain/repositories/FoodEntryWriter';
import type { RecoveryCheckInWriter } from '../domain/repositories/RecoveryCheckInWriter';
import type { SetupWriter } from '../domain/repositories/SetupWriter';
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

type DemoMeal = readonly [meal: Meal, name: string, protein: number, carbs: number, fat: number, fiber: number];

const breakfast: DemoMeal = ['breakfast', 'Demo oats and yogurt', 40, 65, 18, 8];

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
};

/** The demo's water on a day: a bottle in the morning and glasses after (MM-313). */
const waterOf = (partial: boolean): readonly (readonly [hour: number, ml: number])[] =>
  partial ? [[8, 500], [10, 250]] : [[8, 500], [10, 250], [13, 250], [16, 500], [19, 250]];
const restOfTheDay: readonly DemoMeal[] = [
  ['lunch', 'Demo chicken and rice', 55, 90, 22, 6],
  ['dinner', 'Demo tofu and potatoes', 50, 80, 25, 10],
  ['snack', 'Demo fruit and nuts', 15, 25, 10, 5],
];

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
  }: {
    eraser: DataEraser;
    setup: SetupWriter;
    weights: WeightWriter;
    waist: WaistWriter;
    food: FoodEntryWriter;
    dayMarks: DayMarkWriter;
    targets: TargetsHistoryWriter;
    recovery: RecoveryCheckInWriter;
    workouts?: WorkoutWriter | undefined;
    water?: WaterWriter | undefined;
  }): Promise<void> {
    await eraser.eraseAll();
    const start = this.today.addDays(-DemoSeed.historyDays);
    await setup.saveSetup(typicalSetup({ onboardedOn: start, healthCheckConfirmedOn: this.today }));
    for (let i = 0; i <= DemoSeed.historyDays; i++) {
      const date = start.addDays(i);
      await weights.saveWeight(date, 86 - i * 0.035 + Math.sin(i * 1.7) * 0.35);
      if (i % 7 === 0) {
        const week = Math.trunc(i / 7);
        const fourWeeks = Math.trunc(i / 28);
        await waist.saveWaist(date, 94 - i * 0.045);
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
      for (const [meal, name, protein, carbs, fat, fiber] of partial ? [breakfast] : [breakfast, ...restOfTheDay]) {
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
            source: 'weighed',
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
        const progress = (98 - daysAgo) / 7;
        const lifts: readonly (readonly [id: string, load: number])[] = [
          ['barbell-bench-press', 70.0 + progress],
          ['back-squat', 95.0 + progress * 1.5],
          ['barbell-row', 55.0 + progress * 0.5],
          ['pull-up', progress < 7 ? -10.0 : 0.0],
        ];
        await workouts.saveWorkout(
          new Workout({
            id: 0,
            date,
            startedAt,
            endedAt: new Date(startedAt.getTime() + 55 * minuteMs),
            exercises: [
              ...lifts.map(
                ([exerciseId, loadKg]) =>
                  new WorkoutExercise({
                    exerciseId,
                    sets: [new WorkoutSet({ reps: 6, loadKg, rir: 2 }), new WorkoutSet({ reps: 5, loadKg, rir: 1 })],
                  }),
              ),
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
