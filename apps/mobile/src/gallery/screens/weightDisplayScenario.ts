import type { WeightDisplay } from '../../domain/WeightDisplay';
import { demoWith } from './demoWith';
import type { StoryScenario } from './StoryScenario';

/** The demo's ten weeks with the weight display chosen as `display` (MM-118). */
export const weightDisplayScenario = (display: WeightDisplay): StoryScenario =>
  demoWith({ then: (repos) => repos.preferences.saveWeightDisplay(display) });
