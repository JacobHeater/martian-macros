import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * A day 60 kcal under a 2,473 kcal target (MM-123): inside the band, so
 * the hero says on target and shows the target rounded to 2,475.
 */
export const onTargetScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.targets.saveTargets(storyTargets(today.addDays(-30), { kcal: 2473, proteinG: 172, proteinMinimumG: 128 }));
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Oats, yogurt and berries', kcal: 613, proteinG: 32, carbsG: 80, fatG: 16, source: 'weighed' }),
  );
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today, meal: 'lunch', name: 'Chicken, rice and greens', kcal: 820, proteinG: 58, carbsG: 90, fatG: 22, source: 'weighed' }),
  );
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today, meal: 'dinner', name: 'Salmon, potatoes and salad', kcal: 980, proteinG: 55, carbsG: 85, fatG: 40, source: 'weighed' }),
  );
};
