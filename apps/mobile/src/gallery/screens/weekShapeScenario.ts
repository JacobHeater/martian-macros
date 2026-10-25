import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Seventy days in at maintenance, the last four weeks logged whole with one
 * shape to them (MM-141): weekends about 500 kcal above each week's
 * weekdays (MM-615), or one weekday the highest day in the last two weeks,
 * or one weekday unlogged in all four (MM-614).
 * Weighed daily and flat, so no stall competes with the pattern.
 */
export const weekShapeScenario =
  (shape: 'weekend' | 'highestDay' | 'unloggedDay'): StoryScenario =>
  async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-70), healthCheckConfirmedOn: today }));
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-60), {
        kcal: 2400,
        proteinG: 160,
        proteinMinimumG: 130,
        carbsG: 260,
        mode: 'maintenance',
        weeklyRateFraction: 0,
        tdeeSigmaKcal: 150,
        tdeeStatus: 'updated',
      }),
    );
    const standout = today.addDays(-3).weekday;
    for (let i = 0; i <= 28; i++) {
      const day = today.addDays(-i);
      await repos.weights.saveWeight(day, 82);
      if (i === 0) continue;
      if (shape === 'unloggedDay' && day.weekday === standout) continue;
      const kcal =
        shape === 'weekend' && day.isWeekend ? 2900 : shape === 'highestDay' && day.weekday === standout ? 3000 : 2400;
      await repos.food.addFood(
        new FoodEntry({ id: 0, date: day, meal: 'dinner', name: 'Demo day of food', kcal, proteinG: 150, carbsG: 260, fatG: 75, source: 'weighed' }),
      );
      await repos.dayMarks.setCompleteness(day, 'complete');
    }
  };
