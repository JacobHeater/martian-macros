import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

/** Twelve unbroken weeks of a cut, recovery fine (MM-135): the coach offers the two-week break. */
export const breakOfferScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-100), healthCheckConfirmedOn: today.addDays(-30) }));
  for (let i = 0; i < 14; i++) await repos.weights.saveWeight(today.addDays(-i), 82 + i * 0.09);
  await repos.targets.saveTargets(
    storyTargets(today.addDays(-84), { kcal: 2000, proteinG: 160, carbsG: 200, tdeeKcal: 2600, tdeeSigmaKcal: 300 }),
  );
};
