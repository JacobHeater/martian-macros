import type { CandidateFood } from './CandidateFood';
import type { ConflictResolution } from './ConflictResolution';

/**
 * The rule for two sources that both have a barcode (MM-51). Which source
 * wins is the product owner's decision, so it is a parameter.
 */
export interface ConflictPolicy {
  resolve(first: CandidateFood, second: CandidateFood): ConflictResolution;
}
