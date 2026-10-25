import type { CalendarDate } from '../../domain/CalendarDate';
import { FoodEntry } from '../../domain/FoodEntry';
import type { Meal } from '../../domain/Meal';
import { ScreeningAnswers } from '../../domain/ScreeningAnswers';
import type { WeightDisplay } from '../../domain/WeightDisplay';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * The owner's fat week (MM-606's first scenario, as `test/engine/support/foodAnalysis.ts` has it) for the Coach
 * tab's analysis (MM-610): on a cut at 2,400 kcal, protein 170 g with a 140 g minimum and fat 70 g, the 14 days
 * through yesterday logged in full, fat at about 1.4 times its target on 10 of them and protein under the minimum on
 * 9, every day within the calorie band; peanut butter at breakfast gives the largest share of the fat. Today has the
 * peanut butter breakfast so far. With `busy`, the same days at Full detail carry little fiber and a lot of sodium
 * under a 2,300 mg limit, so more is worth changing than the three listed.
 */
export const analysisFatWeekScenario =
  ({
    eatingDisorderHistory = false,
    weightDisplay,
    busy = false,
  }: { eatingDisorderHistory?: boolean; weightDisplay?: WeightDisplay; busy?: boolean } = {}): StoryScenario =>
  async (repos, today) => {
    await repos.setup.saveSetup(
      typicalSetup({
        onboardedOn: today.addDays(-70),
        healthCheckConfirmedOn: today,
        screening: new ScreeningAnswers({ eatingDisorderHistory }),
      }),
    );
    await repos.targets.saveTargets(
      storyTargets(today.addDays(-60), { kcal: 2400, proteinG: 170, proteinMinimumG: 140, fatG: 70, carbsG: 250, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
    );
    if (weightDisplay !== undefined) await repos.preferences.saveWeightDisplay(weightDisplay);
    if (busy) {
      await repos.preferences.saveDetailLevel('full');
      await repos.preferences.saveSodiumLimit(2300, today.addDays(-30));
    }
    for (let i = 0; i <= 28; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.05);
    const food = (date: CalendarDate, meal: Meal, name: string, kcal: number, proteinG: number, fatG: number) =>
      repos.food.addFood(
        new FoodEntry({
          id: 0,
          date,
          meal,
          name,
          kcal,
          proteinG,
          carbsG: Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4),
          fatG,
          source: 'weighed',
          ...(busy ? { fiberG: 2, sodiumMg: 1500 } : {}),
        }),
      );
    // A: peanut butter, fat high, protein short. B: fat high, protein met. C: fat at target, protein short. D: both fine.
    const kinds = ['A', 'B', 'A', 'C', 'A', 'D', 'A', 'B', 'A', 'D', 'A', 'D', 'A', 'A'] as const;
    for (const [i, kind] of kinds.entries()) {
      const date = today.addDays(i - 14);
      if (kind === 'A') await food(date, 'breakfast', 'Peanut butter', 400, 14, 34);
      else if (kind === 'B') await food(date, 'breakfast', 'Eggs and bacon', 400, 24, 33);
      else await food(date, 'breakfast', 'Oatmeal', 400, 14, 8);
      const lunchProtein = kind === 'A' || kind === 'C' ? 35 : 60;
      const [dinnerProtein, dinnerFat] = kind === 'A' || kind === 'C' ? [50, 26] : kind === 'B' ? [60, 27] : [66, 24];
      await food(date, 'lunch', `Lunch dish ${i}`, 750, lunchProtein, 28);
      await food(date, 'dinner', `Dinner dish ${i}`, 900, dinnerProtein, dinnerFat);
      await food(date, 'snack', 'Crackers', 330, 6, 10);
      await repos.dayMarks.setCompleteness(date, 'complete');
    }
    await food(today, 'breakfast', 'Peanut butter', 400, 14, 34);
  };
