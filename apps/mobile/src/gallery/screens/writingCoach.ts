import { InMemoryCoachNarrator } from '../../fixtures/InMemoryCoachNarrator';
import type { StoryDevice } from './StoryDevice';

/**
 * A phone with a BYOK coach set up whose model never answers (MM-673): the
 * screens show the wait where the coach's words will stand.
 */
export const writingCoach: StoryDevice = async (services) => {
  await services.coachAi.saveConfig({ provider: 'gemini', apiKey: 'AIzaSyDemoKey' });
  const coachNarrator = new InMemoryCoachNarrator();
  coachNarrator.pending = true;
  return { ...services, coachNarrator };
};
