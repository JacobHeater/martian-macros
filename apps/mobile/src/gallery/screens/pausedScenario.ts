import { Pause } from '../../domain/Pause';
import { DemoSeed } from '../../fixtures/DemoSeed';
import type { StoryScenario } from './StoryScenario';

/** The demo's ten weeks with a pause for travel running through today and the next four days (MM-148). */
export const pausedScenario: StoryScenario = async (repos, today) => {
  await new DemoSeed(today).replace(repos);
  await repos.pauses.savePause(new Pause({ from: today.addDays(-2), to: today.addDays(4), reason: 'travel' }));
};
