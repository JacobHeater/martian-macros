import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistObservation } from '../domain/WaistObservation';
import type { MeasuredChange } from './MeasuredChange';
import { WaistChange } from './WaistChange';
import { waistNoiseOf } from './waistNoiseOf';
import { WaistRule } from './WaistRule';

/** The middle value of the entries' measurements. */
function middle(of: readonly WaistObservation[]): number {
  const sorted = of.map((entry) => entry.waistCm).sort((a, b) => a - b);
  const mid = Math.trunc(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/**
 * Whether the waist changed over the `days` up to `asOf` (MM-155), or
 * undefined when there is not a measurement at both ends to compare.
 *
 * The comparison is between smoothed values, never single entries: the
 * middle value of the latest three entries against that of the three
 * nearest the day `days` ago. The latest entry has to be from the last
 * two weeks. A difference is a change only when it exceeds the noise of a
 * difference, 1.4 times the noise figure; inside that it is no clear
 * change. The figure is `waistNoiseOf` the entries, or `siteNoiseCm` for
 * another site (MM-156), half as much again when either of the two ends
 * compared includes a single reading (an entry outside both ends changes
 * nothing); `noiseCm`, when given, is the figure as it stands.
 *
 * With `sinceStart`, the comparison is with the first three entries ever
 * instead, so the starting point is not one noisy reading.
 */
export function waistChangeOf({
  waist,
  asOf,
  days = 28,
  sinceStart = false,
  noiseCm,
  siteNoiseCm,
}: {
  waist: Iterable<WaistObservation>;
  asOf: CalendarDate;
  days?: number;
  sinceStart?: boolean;
  noiseCm?: number | undefined;
  /** Another site's own noise figure, in place of the waist's (MM-156). */
  siteNoiseCm?: number | undefined;
}): WaistChange | undefined {
  const all = [...waist];
  const entries = all.filter((entry) => !entry.date.isAfter(asOf)).sort((a, b) => a.date.compareTo(b.date));
  const latest = entries[entries.length - 1];
  if (latest === undefined || latest.date.daysUntil(asOf) >= WaistRule.latestWithinDays) {
    return undefined;
  }

  let recent: WaistObservation[];
  let baseline: WaistObservation[];
  if (sinceStart) {
    // Each end gets up to three entries, and no entry is at both.
    const half = Math.trunc(entries.length / 2);
    const first = half < WaistRule.smoothedEntries ? half : WaistRule.smoothedEntries;
    baseline = entries.slice(0, first);
    const rest = entries.slice(first);
    recent = rest.length <= WaistRule.smoothedEntries ? rest : rest.slice(rest.length - WaistRule.smoothedEntries);
  } else {
    const fresh = entries.filter((entry) => entry.date.daysUntil(asOf) < WaistRule.recentWithinDays);
    recent =
      fresh.length <= WaistRule.smoothedEntries ? fresh : fresh.slice(fresh.length - WaistRule.smoothedEntries);
    const target = asOf.addDays(-days);
    const firstRecent = recent[0];
    const distance = (entry: WaistObservation) => Math.abs(entry.date.daysUntil(target));
    const near =
      firstRecent === undefined
        ? []
        : entries
            .filter(
              (entry) => entry.date.isBefore(firstRecent.date) && distance(entry) <= WaistRule.baselineWithinDays,
            )
            .sort((a, b) => {
              const byDistance = distance(a) - distance(b);
              return byDistance !== 0 ? byDistance : a.date.compareTo(b.date);
            });
    baseline = near.slice(0, WaistRule.smoothedEntries);
  }
  if (recent.length === 0 || baseline.length === 0) return undefined;

  const from = middle(baseline);
  const to = middle(recent);
  // The user's own figure once there is one; half as much again when
  // either end rests on a single reading.
  const single = [...recent, ...baseline].some((e) => e.isSingleReading);
  const noise = noiseCm ?? (siteNoiseCm ?? waistNoiseOf(all)) * (single ? WaistRule.singleReadingFactor : 1);
  const threshold = WaistRule.differenceFactor * noise;
  // A hair of tolerance, so a change of exactly the threshold counts
  // whatever the arithmetic did to its last digit.
  const change = to - from;
  const direction: MeasuredChange =
    change <= -threshold + 1e-9 ? 'down' : change >= threshold - 1e-9 ? 'up' : 'noClearChange';
  return new WaistChange({
    direction,
    fromCm: from,
    toCm: to,
    thresholdCm: threshold,
    recentEntries: recent.length,
    baselineEntries: baseline.length,
  });
}
