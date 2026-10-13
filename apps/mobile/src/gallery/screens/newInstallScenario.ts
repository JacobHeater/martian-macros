import type { StoryScenario } from './StoryScenario';

/** Nothing stored: the app as it first opens. */
export const newInstallScenario: StoryScenario = () => Promise.resolve();
