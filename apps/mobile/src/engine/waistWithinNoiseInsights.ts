import type { WaistObservation } from '../domain/WaistObservation';
import type { ItemInsight } from './ItemInsight';
import { waistChangeOf } from './waistChangeOf';
import { waistNoiseOf } from './waistNoiseOf';
import { WaistRule } from './WaistRule';

/** The entries at each end a comparison needs before it is said (as the recomp signal asks). */
const minimumEntries = 3;

/**
 * The "waist: no clear change" insight under the Dashboard's waist row
 * (MM-367): the app's one shared answer for the waist (`waistChangeOf`,
 * MM-155, smoothed over 28 days) is no clear change, said only when the
 * latest reading moved from the one before it by at least the tape's noise,
 * the moment the person is most likely to read a change into it (the
 * panel's ME-4, ME-5). Nothing is said for a reading much like the last,
 * so a weekly measurer is not told "no change" every week.
 */
export function waistWithinNoiseInsights({ waist }: { waist: readonly WaistObservation[] }): ItemInsight[] {
  const sorted = [...waist].sort((a, b) => a.date.compareTo(b.date));
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  if (latest === undefined || previous === undefined) return [];
  if (Math.abs(latest.waistCm - previous.waistCm) < waistNoiseOf(waist)) return [];
  const change = waistChangeOf({ waist, asOf: latest.date });
  if (change === undefined || change.direction !== 'noClearChange') return [];
  if (change.recentEntries + change.baselineEntries < minimumEntries) return [];
  return [
    {
      kind: 'waistWithinNoise',
      anchor: { kind: 'waist', id: `${latest.date.epochDay}` },
      subject: 'waist',
      basis: 'pattern',
      figures: {
        fromCm: change.fromCm,
        toCm: change.toCm,
        thresholdCm: change.thresholdCm,
        latestCm: latest.waistCm,
        previousCm: previous.waistCm,
        days: 28,
        differenceFactor: WaistRule.differenceFactor,
      },
      from: latest.date.addDays(-28),
      to: latest.date,
    },
  ];
}
