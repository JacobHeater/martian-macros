import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/**
 * Onboarded yesterday and weighed then, not yet today, nothing logged: the
 * Dashboard as it opens most mornings, asking for the weigh-in in place.
 */
export const notWeighedTodayScenario: StoryScenario = async (repos, today) => {
  const yesterday = today.addDays(-1);
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: yesterday, healthCheckConfirmedOn: yesterday }));
  await repos.weights.saveWeight(yesterday, 86);
};
