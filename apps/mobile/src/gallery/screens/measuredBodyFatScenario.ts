import { demoScenario } from './demoScenario';
import type { StoryScenario } from './StoryScenario';

/** The demo's person, with a measured body fat entered: Settings shows both of its sliders (MM-240). */
export const measuredBodyFatScenario: StoryScenario = async (repos, today) => {
  await demoScenario(repos, today);
  const setup = await repos.setup.loadSetup();
  if (setup !== undefined) await repos.setup.saveSetup(setup.copyWith({ bodyFatPercent: 22 }));
};
