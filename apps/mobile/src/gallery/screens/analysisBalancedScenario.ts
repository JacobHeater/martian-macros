import type { CalendarDate } from '../../domain/CalendarDate';
import { FoodEntry } from '../../domain/FoodEntry';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import type { Meal } from '../../domain/Meal';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * A fortnight with as much holding up as worth changing, for the Coach tab's analysis (MM-610's "N more from your
 * data", with both kinds): on a cut at 2,400 kcal against an energy use of 2,500 (updated from the person's own data),
 * protein 170 g with a 140 g minimum, fat 70 g and carbohydrate 270 g, the 14 days through yesterday logged in full at
 * Full detail. Every day is on its targets (protein 183 g, fat 70 g, 2,400 kcal), with protein in each large meal, so
 * protein, calories (fat with them, one line per family), carbohydrate and the balance of the meals hold up; and
 * intake around maintenance, crisps weighed at over 5 kcal a gram, little fiber and a lot of sodium under a 2,300 mg
 * limit are each worth changing. Four of each: past three, the rest folds under "N more", in two groups.
 */
export const analysisBalancedScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-70), healthCheckConfirmedOn: today }));
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-60), { kcal: 2400, proteinG: 170, proteinMinimumG: 140, fatG: 70, carbsG: 270, tdeeKcal: 2500, tdeeSigmaKcal: 150, tdeeStatus: 'updated' }),
  );
  await repos.preferences.saveDetailLevel('full');
  await repos.preferences.saveSodiumLimit(2300, today.addDays(-30));
  for (let i = 0; i <= 28; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.05);
  const food = (date: CalendarDate, meal: Meal, name: string, kcal: number, proteinG: number, fatG: number, grams?: number) => {
    const carbsG = Math.max(0, (kcal - 4 * proteinG - 9 * fatG) / 4);
    return repos.food.addFood(
      new FoodEntry({
        id: 0,
        date,
        meal,
        name,
        kcal,
        proteinG,
        carbsG,
        fatG,
        source: 'weighed',
        fiberG: 2,
        sodiumMg: 1500,
        portion:
          grams === undefined
            ? undefined
            : {
                method: 'weighed',
                basis: 'calculated',
                quantity: grams,
                unit: 'gram',
                reference: {
                  basis: 'per100g',
                  nutrition: new NutritionTotals({
                    kcal: (100 * kcal) / grams,
                    proteinG: (100 * proteinG) / grams,
                    carbsG: (100 * carbsG) / grams,
                    fatG: (100 * fatG) / grams,
                  }),
                },
              },
      }),
    );
  };
  for (let i = 1; i <= 14; i++) {
    const date = today.addDays(-i);
    await food(date, 'breakfast', 'Protein oats', 500, 50, 12);
    await food(date, 'lunch', 'Chicken and rice', 700, 80, 15);
    await food(date, 'dinner', 'Pasta with meat sauce', 900, 50, 25);
    await food(date, 'snack', 'Crisps', 300, 3, 18, 57);
    await repos.dayMarks.setCompleteness(date, 'complete');
  }
  await food(today, 'breakfast', 'Protein oats', 500, 50, 12);
};
