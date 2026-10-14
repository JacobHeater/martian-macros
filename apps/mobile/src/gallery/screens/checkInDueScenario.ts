import { InMemoryRecoveryCheckInRepository } from '../../fixtures/InMemoryRecoveryCheckInRepository';
import { demoScenario } from './demoScenario';
import type { StoryScenario } from './StoryScenario';

/** The demo's person with this week's recovery check-in not yet answered: Coach shows its one thing to do (MM-299). */
export const checkInDueScenario: StoryScenario = async (repos, today) => {
  await demoScenario(repos, today);
  if (repos.recovery instanceof InMemoryRecoveryCheckInRepository) repos.recovery.clear();
};
