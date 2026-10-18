import { SourceReliabilityRule } from '../foodCatalog/SourceReliabilityRule';
import type { CandidateFood } from './CandidateFood';
import type { ConflictPolicy } from './ConflictPolicy';
import type { ConflictResolution } from './ConflictResolution';
import { MostRecentPolicy } from './MostRecentPolicy';
import { PreferredSourcePolicy } from './PreferredSourcePolicy';

/**
 * The record from the more reliable source wins a shared barcode (MM-383,
 * the panel's IN-16, P-1): the app's own reliability bases decide, so the
 * manufacturer's label (USDA Branded) is written over a volunteer's
 * transcription (Open Food Facts), and a scan shows what the score says.
 * Two records from sources of one base fall to recency, then to
 * `tieBreak`. A difference of more than 10% still marks the winner
 * "check this". Supersedes MM-51's recency rule as the build's default.
 */
export class ReliabilityPolicy implements ConflictPolicy {
  private readonly within: MostRecentPolicy;

  constructor({ tieBreak = 'usda_branded' }: { tieBreak?: string } = {}) {
    this.within = new MostRecentPolicy({ tieBreak });
  }

  resolve(first: CandidateFood, second: CandidateFood): ConflictResolution {
    const base = (c: CandidateFood) => SourceReliabilityRule.bases[c.source] ?? 0;
    if (base(first) === base(second)) return this.within.resolve(first, second);
    const winner = base(first) > base(second) ? first : second;
    return { winner, disagree: PreferredSourcePolicy.differ(first, second) };
  }
}
