/**
 * The calories a trade's Y may have a time (MM-607): the band around X, at
 * least `minKcal` and, unless on lean gain, at most `maxKcal`.
 */
export interface TradeTarget {
  readonly minKcal: number;
  readonly maxKcal: number | undefined;
}
