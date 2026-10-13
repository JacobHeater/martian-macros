/**
 * Standard deviations that put a threshold at the 25th (or 75th) percentile
 * of a normal estimate: the point where the chance of being on the other
 * side is a quarter.
 */
export const quartileSigmas = 0.6745;

/**
 * How far the cautious body fat must move, in percentage points, before the
 * safety rules switch branch, in either direction (no flipping).
 */
export const safetyBodyFatDeadbandPercent = 2;
