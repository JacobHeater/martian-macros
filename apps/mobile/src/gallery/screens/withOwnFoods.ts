import { CustomFood } from '../../domain/food/custom/CustomFood';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import { DemoSeed } from '../../fixtures/DemoSeed';
import type { StoryScenario } from './StoryScenario';

/** The demo with one food and one recipe of the person's own (MM-45). */
export const withOwnFoods: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Demo overnight oats',
      kind: 'food',
      servingDescription: '1 jar',
      servingGrams: 250,
      perServing: new NutritionTotals({ kcal: 410, proteinG: 24, carbsG: 52, fatG: 11 }),
    }),
  );
  await repos.customFoods.saveCustomFood(
    new CustomFood({
      id: 0,
      name: 'Demo chili',
      kind: 'recipe',
      servingDescription: '1 bowl',
      servings: 4,
      perServing: new NutritionTotals({ kcal: 511, proteinG: 46, carbsG: 36, fatG: 20 }),
      ingredients: [
        { name: 'Ground beef, lean, cooked', grams: 500, totals: new NutritionTotals({ kcal: 1250, proteinG: 130, carbsG: 0, fatG: 75 }) },
        { name: 'Black beans, cooked', grams: 600, totals: new NutritionTotals({ kcal: 792, proteinG: 53, carbsG: 144, fatG: 3 }) },
      ],
    }),
  );
};
