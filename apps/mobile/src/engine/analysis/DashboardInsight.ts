import type { Insight } from '../Insight';
import type { TrendAnnouncement } from '../trends/TrendAnnouncement';
import type { CoachFinding } from './CoachFinding';

/**
 * What the Dashboard's insight card shows (MM-141, MM-610): a finding of
 * the coach's analysis that the announcement log said (new, reversed,
 * update, back again, or resolved good news, shown as its holding-up line),
 * or an insight from a catalog rule the analysis has no equivalent of, and
 * whether that one starts showing now (so it is written to the insight log).
 */
export type DashboardInsight =
  | { readonly kind: 'finding'; readonly finding: CoachFinding; readonly transition: TrendAnnouncement['transition'] }
  | { readonly kind: 'rule'; readonly insight: Insight; readonly isNew: boolean };
