import { addons } from 'storybook/preview-api';
import type { StoryFact } from './StoryFact';
import { storyFactsEvent } from './storyFactsEvent';

/** Sends a story's facts to the "Person" panel (MM-356); outside Storybook, as in the tests, there is no one to tell. */
export function announceStoryFacts(facts: readonly StoryFact[]): void {
  if (addons.hasChannel()) addons.getChannel().emit(storyFactsEvent, facts);
}
