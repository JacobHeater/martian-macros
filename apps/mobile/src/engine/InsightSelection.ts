import type { Insight } from './Insight';

/**
 * The insight chosen for today, and whether it starts showing now (so the
 * caller records it) or was already showing (MM-141).
 */
export interface InsightSelection {
  readonly insight: Insight;
  readonly isNew: boolean;
}
