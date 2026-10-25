import type { CoachFinding } from '../CoachFinding';

/** MM-606's food analysis of one span (`foodSpanAnalysisOf`): what it found, and what has not passed its exit yet. */
export interface FoodSpanAnalysis {
  readonly findings: CoachFinding[];

  /**
   * The finding ids whose exit threshold does not hold yet, though they may
   * not be said (MM-605's state machine): N1 between 50% and 65% of judged
   * days met.
   */
  readonly unresolved: ReadonlySet<string>;
}
