import type { FoodEntry } from '../../FoodEntry';

/**
 * What a day's entries say about sodium (MM-312): the known amount, and the
 * share of the day's calories from entries that state it. A day is over a
 * limit for certain when the known amount is above it, since a missing value
 * can only add; it is under only when enough of the day states sodium.
 */
export class SodiumDay {
  /** The share of a day's calories that must state sodium to call it under a limit: the fiber rule's (MM-126). */
  static readonly minimumCoverage = 0.7;

  readonly knownMg: number;
  readonly coveredShare: number;

  constructor(init: { knownMg: number; coveredShare: number }) {
    this.knownMg = init.knownMg;
    this.coveredShare = init.coveredShare;
  }

  /** Over `limitMg`, under it, or unknown when too little of the day states sodium. */
  against(limitMg: number): 'over' | 'under' | 'unknown' {
    if (this.knownMg > limitMg) return 'over';
    return this.coveredShare >= SodiumDay.minimumCoverage ? 'under' : 'unknown';
  }

  static of(entries: Iterable<FoodEntry>): SodiumDay {
    let known = 0;
    let kcal = 0;
    let covered = 0;
    for (const e of entries) {
      kcal += e.kcal;
      if (e.sodiumMg !== undefined) {
        known += e.sodiumMg;
        covered += e.kcal;
      }
    }
    return new SodiumDay({ knownMg: known, coveredShare: kcal <= 0 ? 0 : covered / kcal });
  }
}
