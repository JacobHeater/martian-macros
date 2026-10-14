import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/**
 * Two weeks in, weighed every morning including today, the waist last
 * measured nine days ago: the Dashboard asks for the waist in place
 * (MM-301).
 */
export const waistDueScenario: StoryScenario = async (repos, today) => {
  const start = today.addDays(-14);
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: start, healthCheckConfirmedOn: start }));
  for (let d = 14; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 86 - (14 - d) * 0.05);
  await repos.waist.saveWaist(start, 94.5);
  await repos.waist.saveWaist(today.addDays(-9), 94);
};
