import type { PaceInWords } from './PaceInWords';

/** Within this much of body weight a week either way, a trend meant to hold is steady. */
const steadyFractionPerWeek = 0.001;

/**
 * The trend's weekly change against the intended one, both as fractions of
 * body weight a week, negative for loss (MM-118). With a pace intended,
 * under half of it (or the other way) is slower than planned, over one and a
 * half times it is faster, and between is on pace. With none intended, a
 * trend within 0.1% a week is steady; one moving more is faster than planned.
 */
export function paceInWordsOf({
  trendFractionPerWeek,
  intendedFractionPerWeek,
}: {
  trendFractionPerWeek: number;
  intendedFractionPerWeek: number;
}): PaceInWords {
  if (intendedFractionPerWeek === 0) {
    return Math.abs(trendFractionPerWeek) <= steadyFractionPerWeek ? 'steady' : 'fasterThanPlanned';
  }
  const share = trendFractionPerWeek / intendedFractionPerWeek;
  if (share < 0.5) return 'slowerThanPlanned';
  if (share > 1.5) return 'fasterThanPlanned';
  return 'onPace';
}
