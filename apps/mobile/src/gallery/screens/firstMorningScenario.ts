import { FoodEntry } from '../../domain/FoodEntry';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Onboarded this morning (MM-610's "Opens on today"): one weigh-in, the first targets, and a breakfast logged, the
 * first entry there is. The Coach tab's analysis reads today so far, and offers no other span.
 */
export const firstMorningScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 86);
  await repos.targets.saveTargets(storyTargets(today, { kcal: 2400, proteinG: 170, proteinMinimumG: 140, fatG: 70, carbsG: 250 }));
  await repos.food.addFood(
    new FoodEntry({ id: 0, date: today, meal: 'breakfast', name: 'Greek yogurt and oats', kcal: 450, proteinG: 30, carbsG: 55, fatG: 10, source: 'weighed' }),
  );
};
