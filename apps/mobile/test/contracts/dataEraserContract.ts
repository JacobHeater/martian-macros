import { TermsAcceptance } from '../../src/domain/TermsAcceptance';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import type { CustomExerciseRepository } from '../../src/domain/repositories/CustomExerciseRepository';
import type { DataEraser } from '../../src/domain/repositories/DataEraser';
import type { FoodRepository } from '../../src/domain/repositories/FoodRepository';
import type { PreferencesRepository } from '../../src/domain/repositories/PreferencesRepository';
import type { SetupRepository } from '../../src/domain/repositories/SetupRepository';
import type { WeightEventRepository } from '../../src/domain/repositories/WeightEventRepository';
import type { WeightRepository } from '../../src/domain/repositories/WeightRepository';
import type { WorkoutRepository } from '../../src/domain/repositories/WorkoutRepository';
import { Exercise } from '../../src/domain/training/Exercise';
import { Workout } from '../../src/domain/training/Workout';
import { WorkoutExercise } from '../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../src/domain/training/WorkoutSet';
import { DailyTargets } from '../../src/engine/DailyTargets';
import type { TargetsHistoryRepository } from '../../src/engine/TargetsHistoryRepository';
import { TargetsRecord } from '../../src/engine/TargetsRecord';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';

interface Erasable {
  eraser: DataEraser;
  setup: SetupRepository;
  weights: WeightRepository;
  weightEvents: WeightEventRepository;
  food: FoodRepository;
  targets: TargetsHistoryRepository;
  preferences: PreferencesRepository;
  workouts: WorkoutRepository;
  customExercises: CustomExerciseRepository;
}

/**
 * What every `DataEraser` must do. `create` returns the eraser and the
 * repositories it must empty.
 */
export function dataEraserContract(name: string, create: () => Erasable | Promise<Erasable>): void {
  describe(`${name} as a DataEraser`, () => {
    it('eraseAll empties everything', async () => {
      const r = await create();
      const day = CalendarDate.of(2026, 1, 1);
      await r.setup.saveSetup(typicalSetup());
      await r.weights.saveWeight(day, 80);
      await r.weightEvents.saveWeightEvent({ date: day, type: 'illness' });
      await r.food.addFood(
        new FoodEntry({
          id: 0,
          date: day,
          meal: 'breakfast',
          name: 'Oats',
          kcal: 300,
          proteinG: 10,
          carbsG: 50,
          fatG: 5,
          source: 'weighed',
        }),
      );
      await r.preferences.saveThemePreference('dark');
      await r.targets.saveTargets(
        new TargetsRecord({
          effectiveFrom: day,
          mode: 'fatLoss',
          tdeeKcal: 2600,
          tdeeSigmaKcal: 300,
          tdeeStatus: 'held',
          targets: new DailyTargets({ kcal: 2000, proteinG: 160, fatG: 70, carbsG: 200, weeklyRateFraction: -0.0075 }),
        }),
      );
      await r.workouts.saveWorkout(
        new Workout({
          id: 0,
          date: day,
          startedAt: new Date(2026, 0, 1, 18),
          exercises: [
            new WorkoutExercise({ exerciseId: 'back-squat', sets: [new WorkoutSet({ reps: 8, loadKg: 100 })] }),
          ],
        }),
      );
      await r.customExercises.saveCustomExercise(
        new Exercise({ id: '', name: 'Landmine press', equipment: 'barbell', primary: 'shoulders' }),
      );
      await r.preferences.saveTermsAcceptance(new TermsAcceptance({ version: 1, acceptedOn: day }));

      await r.eraser.eraseAll();

      expect(await r.setup.loadSetup()).toBeUndefined();
      expect(await first(r.weights.watchWeights())).toEqual([]);
      expect(await first(r.weightEvents.watchWeightEvents())).toEqual([]);
      expect(await first(r.food.watchFood(day))).toEqual([]);
      expect(await first(r.targets.watchTargetsHistory())).toEqual([]);
      expect(await first(r.workouts.watchWorkouts())).toEqual([]);
      expect(await first(r.customExercises.watchCustomExercises())).toEqual([]);
      expect(await first(r.preferences.watchThemePreference())).toBe('unselected');
      // MM-242: first use again, so the terms are asked again.
      expect(await first(r.preferences.watchTermsAcceptance())).toBeUndefined();
    });
  });
}
