/**
 * How noisy a waist measurement is taken to be (MM-155). The figures are
 * judgment built on published measurement error and ordinary day-to-day
 * swings, not validated thresholds.
 */
export const WaistRule = {
  /**
   * The noise of one entry made as the app asks: the middle of three
   * readings.
   */
  medianOfThreeNoiseCm: 1,

  /**
   * The noise of an entry that is a single reading, and what it is as a
   * multiple of the figure for the middle of three.
   */
  singleReadingNoiseCm: 1.5,
  singleReadingFactor: 1.5,

  /**
   * From this many entries with all three readings, the noise figure is
   * the user's own, and it is never taken to be under the floor.
   */
  personalAfter: 8,
  personalFloorCm: 0.5,

  /**
   * A difference between two measurements is noisier than either: it has
   * to exceed the noise figure times this to be called a change.
   */
  differenceFactor: 1.4,

  /** How many entries are smoothed into each end of a comparison. */
  smoothedEntries: 3,

  /**
   * The latest entry has to be this recent for "now" to mean now, and no
   * entry older than `recentWithinDays` is part of it.
   */
  latestWithinDays: 14,
  recentWithinDays: 21,

  /**
   * How far from the day being compared with an entry may be and still
   * stand for it.
   */
  baselineWithinDays: 10,
} as const;
