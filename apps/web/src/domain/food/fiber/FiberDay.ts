import type { FoodEntry } from '../../FoodEntry';

/**
 * What a day's entries say about fiber, and whether they say enough to show
 * a total (MM-126). An entry with no fiber value (a typed entry, a food
 * whose source did not state it) is unknown, never zero, so a total is shown
 * only when enough of the day's calories come from entries that carry one.
 */
export class FiberDay {
  static readonly minimumCoverage = 0.7;

  /** Fiber from the entries that state it. */
  readonly totalG: number;

  /** The share, 0 to 1, of the day's calories from entries that carry fiber. */
  readonly coveredShare: number;

  constructor(init: { totalG: number; coveredShare: number }) {
    this.totalG = init.totalG;
    this.coveredShare = init.coveredShare;
  }

  /** Whether `totalG` can be shown as the day's fiber. */
  get enough(): boolean {
    return this.coveredShare >= FiberDay.minimumCoverage;
  }

  static of(entries: Iterable<FoodEntry>): FiberDay {
    let total = 0;
    let kcal = 0;
    let covered = 0;
    for (const e of entries) {
      kcal += e.kcal;
      const fiber = e.fiberG;
      if (fiber !== undefined) {
        total += fiber;
        covered += e.kcal;
      }
    }
    return new FiberDay({ totalG: total, coveredShare: kcal <= 0 ? 0 : covered / kcal });
  }
}
