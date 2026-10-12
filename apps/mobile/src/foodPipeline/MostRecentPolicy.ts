import type { CandidateFood } from './CandidateFood';
import type { ConflictPolicy } from './ConflictPolicy';
import type { ConflictResolution } from './ConflictResolution';
import { PreferredSourcePolicy } from './PreferredSourcePolicy';

/**
 * The record the source changed most recently wins; on a tie, or when
 * neither says, `tieBreak` decides. Differences of more than 10% still mark
 * the food for the user to check.
 *
 * This is the rule from MM-51: a record that fails the nutrition checks
 * never gets here, so only two consistent records are compared, and then
 * the fresher one is the better guess.
 */
export class MostRecentPolicy implements ConflictPolicy {
  /** The source that wins when the records are equally recent. */
  readonly tieBreak: string;

  constructor({ tieBreak }: { tieBreak: string }) {
    this.tieBreak = tieBreak;
  }

  resolve(first: CandidateFood, second: CandidateFood): ConflictResolution {
    const disagree = PreferredSourcePolicy.differ(first, second);
    if (first.updatedAt !== second.updatedAt) {
      const newer = second.updatedAt > first.updatedAt ? second : first;
      return { winner: newer, disagree };
    }
    return new PreferredSourcePolicy(this.tieBreak).resolve(first, second);
  }
}
