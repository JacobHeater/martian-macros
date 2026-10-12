import type { CandidateFood } from './CandidateFood';
import type { ConflictPolicy } from './ConflictPolicy';
import type { ConflictResolution } from './ConflictResolution';

function far(x: number | undefined, y: number | undefined, floor: number): boolean {
  if (x === undefined || y === undefined) return false;
  const larger = x > y ? x : y;
  const tolerance = larger * 0.1 > floor ? larger * 0.1 : floor;
  return Math.abs(x - y) > tolerance;
}

/**
 * The record from `preferredSource` wins, and when the two differ by more
 * than 10% the result is flagged so it can carry the "check this" tier
 * instead of passing as certain. A record that fails the nutrition checks
 * never reaches this point, so "the consistent one wins" is already true.
 */
export class PreferredSourcePolicy implements ConflictPolicy {
  readonly preferredSource: string;

  constructor(preferredSource: string) {
    this.preferredSource = preferredSource;
  }

  resolve(first: CandidateFood, second: CandidateFood): ConflictResolution {
    const winner = second.source === this.preferredSource && first.source !== second.source ? second : first;
    return { winner, disagree: PreferredSourcePolicy.differ(first, second) };
  }

  /** Whether two records differ by more than 10% in energy or a macro. */
  static differ(a: CandidateFood, b: CandidateFood): boolean {
    return (
      far(a.kcal, b.kcal, 10) || far(a.proteinG, b.proteinG, 1) || far(a.carbsG, b.carbsG, 1) || far(a.fatG, b.fatG, 1)
    );
  }
}
