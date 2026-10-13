import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/** Onboarded today: one weigh-in, nothing logged, the coach still calibrating. */
export const firstDayScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 86);
};
