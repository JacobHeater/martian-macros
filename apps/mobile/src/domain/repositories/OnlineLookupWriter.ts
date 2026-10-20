import type { OnlineLookupChoice } from '../food/online/OnlineLookupChoice';

/** Records the person's answer to looking foods up online (MM-58). */
export interface OnlineLookupWriter {
  saveOnlineLookup(choice: OnlineLookupChoice): Promise<void>;
}
