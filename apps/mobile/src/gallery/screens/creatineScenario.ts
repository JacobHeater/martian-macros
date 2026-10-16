import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/**
 * Three weeks in, creatine started six days ago (MM-136): the scale moves
 * with water, so the coach waits for it to settle and pauses reductions.
 */
export const creatineScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-21), healthCheckConfirmedOn: today }).copyWith({ creatineStartedOn: today.addDays(-6) }),
  );
  await repos.targets.saveTargets(storyTargets(today.addDays(-21)));
  for (let d = 21; d >= 0; d--) await repos.weights.saveWeight(today.addDays(-d), 84 - (21 - d) * 0.05 + (d < 6 ? 0.8 : 0));
};
