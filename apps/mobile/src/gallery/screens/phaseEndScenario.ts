import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/** A man ten weeks into a cut who has reached 12% body fat by his own figure (MM-36): the cut has ended. */
export const phaseEndScenario: StoryScenario = async (repos, today) => {
  const setup = typicalSetup({ onboardedOn: today.addDays(-84), healthCheckConfirmedOn: today.addDays(-30) });
  await repos.setup.saveSetup(setup.copyWith({ bodyFatPercent: 12 }));
  for (let i = 0; i < 21; i++) await repos.weights.saveWeight(today.addDays(-i), 74 + i * 0.07);
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-70), { kcal: 2100, proteinG: 170, carbsG: 210, tdeeKcal: 2600, tdeeSigmaKcal: 300 }),
  );
};
