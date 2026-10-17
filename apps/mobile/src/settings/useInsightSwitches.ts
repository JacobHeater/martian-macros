import { useSyncExternalStore } from 'react';
import type { InsightSwitches } from './InsightSwitches';
import type { InsightSwitchesDraft } from './InsightSwitchesDraft';

/** The switches as they stand in `draft`, redrawn whenever one changes. */
export function useInsightSwitches(draft: InsightSwitchesDraft): InsightSwitches {
  return useSyncExternalStore(draft.subscribe, draft.get);
}
