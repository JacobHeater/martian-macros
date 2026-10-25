import type { FoodCue } from './FoodCue';
import type { FoodTag } from './FoodTag';

/** What a lexicon word or phrase means (MM-617): a tag it gives, or a cue that changes the tags around it. */
export type FoodSense = FoodTag | FoodCue;
