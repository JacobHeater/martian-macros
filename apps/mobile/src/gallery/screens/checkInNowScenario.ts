import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Three weeks of weigh-ins, the last `lastWeighInDaysAgo` days ago, and
 * targets three days old well under what today's figures give: "Check in
 * now" on the Coach (MM-559), on when the last weigh-in is from the last
 * week and off, with its notice, when it is older.
 */
export const checkInNowScenario =
  (lastWeighInDaysAgo: number): StoryScenario =>
  async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-21), healthCheckConfirmedOn: today }));
    for (let i = lastWeighInDaysAgo; i <= 21; i++) await repos.weights.saveWeight(today.addDays(-i), 80 + i * 0.05);
    await repos.targets.saveTargets(storyTargets(today.addDays(-3), { kcal: 1800, proteinG: 150, carbsG: 180 }));
  };
