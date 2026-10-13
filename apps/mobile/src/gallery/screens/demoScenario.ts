import { DemoSeed } from '../../fixtures/DemoSeed';
import type { StoryScenario } from './StoryScenario';

/** Ten weeks of a fat-loss phase, logged and trained: the demo app's own seed. */
export const demoScenario: StoryScenario = (repos, today) => new DemoSeed(today).replace(repos);
