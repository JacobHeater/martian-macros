import { typicalSetup } from '../../fixtures/typicalSetup';
import type { StoryScenario } from './StoryScenario';

/** One waist measurement, two hundred days ago, and nothing since (MM-155): the chart has nothing in range. */
export const oldWaistScenario: StoryScenario = async (repos, today) => {
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-220), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.waist.saveWaist(today.addDays(-200), 94, { readings: [93.5, 94, 94.5] });
};
