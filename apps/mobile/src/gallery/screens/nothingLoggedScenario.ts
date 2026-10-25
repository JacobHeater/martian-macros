import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Onboarded this morning with nothing logged at all (MM-610's "Nothing logged yet"): one weigh-in and the first
 * targets, no food. The Coach tab's analysis asks for a food.
 */
export const nothingLoggedScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 86);
  await repos.targets.saveTargets(storyTargets(today, { kcal: 2400, proteinG: 170, proteinMinimumG: 140, fatG: 70, carbsG: 250 }));
};
