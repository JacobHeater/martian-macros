import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightObservation } from '../domain/WeightObservation';
import type { RecompPart } from './RecompPart';
import { RecompSignal } from './RecompSignal';
import type { StrengthTrend } from './StrengthTrend';
import { waistChangeOf } from './waistChangeOf';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * Reads the last four weeks up to `today` for a recomp signal (MM-32).
 * Every threshold is a judgment about how noisy the measurement is, not a
 * validated figure, and each part needs enough logged to be judged at
 * all; otherwise it is unknown, not failed. Nothing is remembered between
 * calls: when a part stops holding, the signal goes.
 *
 * - **Weight is flat** when the trend moved less than 0.5% in 28 days.
 *   Needs weigh-ins on 8 of those days, 2 in the last 7, and 2 within 3
 *   days of the day 28 days ago.
 * - **Waist is down** when the shared change function says so over 28
 *   days (`waistChangeOf`, MM-155), from at least three entries in all.
 * - **Strength is up** when at least two lifts rose and more rose than
 *   fell. A lift rose when its smoothed estimated max is up 2.5% or more
 *   over 28 days, it was trained in the last 14, and it has four sessions
 *   in the last 42; one more rep is about 3% of a max, so less than that
 *   is not a change. Needs two lifts that can be judged.
 */
export function recompSignalOf({
  trend,
  weights,
  waist,
  strengthTrends,
  today,
}: {
  trend: readonly WeightTrendPoint[];
  weights: Iterable<WeightObservation>;
  waist: Iterable<WaistObservation>;
  strengthTrends: Iterable<StrengthTrend>;
  today: CalendarDate;
}): RecompSignal {
  const ago = (date: CalendarDate) => date.daysUntil(today);

  // Weight.
  let weightPart: RecompPart = 'unknown';
  let trendWeightKg: number | undefined;
  const weighedAgo = new Set<number>();
  for (const w of weights) {
    if (ago(w.date) >= 0) weighedAgo.add(ago(w.date));
  }
  const days = [...weighedAgo];
  const enoughWeighIns =
    days.filter((d) => d < 28).length >= 8 &&
    days.filter((d) => d < 7).length >= 2 &&
    days.filter((d) => d >= 25 && d <= 31).length >= 2;
  const at = (daysAgo: number) => trend.find((point) => ago(point.date) === daysAgo);
  const now = at(0);
  const then = at(28);
  if (now !== undefined) trendWeightKg = now.levelKg;
  if (enoughWeighIns && now !== undefined && then !== undefined && then.levelKg > 0) {
    const moved = Math.abs(now.levelKg - then.levelKg) / then.levelKg;
    weightPart = moved < 0.005 ? 'holds' : 'doesNotHold';
  }

  // Waist: the one answer every feature gets (MM-155).
  let waistPart: RecompPart = 'unknown';
  let waistChangeCm: number | undefined;
  const waistChange = waistChangeOf({ waist, asOf: today });
  if (waistChange !== undefined && waistChange.recentEntries + waistChange.baselineEntries >= 3) {
    waistChangeCm = waistChange.changeCm;
    waistPart = waistChange.direction === 'down' ? 'holds' : 'doesNotHold';
  }

  // Strength.
  let strengthPart: RecompPart = 'unknown';
  const liftsUp: string[] = [];
  let judged = 0;
  let down = 0;
  for (const lift of strengthTrends) {
    const points = lift.points.filter((point) => ago(point.date) >= 0);
    const lastPoint = points[points.length - 1];
    if (lastPoint === undefined || ago(lastPoint.date) > 14) continue;
    if (points.filter((p) => ago(p.date) < 42).length < 4) continue;
    const change = lift.changeOverDays(28);
    const latest = lift.points[lift.points.length - 1];
    if (change === undefined || latest === undefined) continue;
    const from = latest.trendKg - change;
    if (from <= 0) continue;
    judged++;
    const fraction = change / from;
    if (fraction >= 0.025) liftsUp.push(lift.name);
    if (fraction <= -0.025) down++;
  }
  if (judged >= 2) {
    strengthPart = liftsUp.length >= 2 && liftsUp.length > down ? 'holds' : 'doesNotHold';
  }

  return new RecompSignal({
    weight: weightPart,
    waist: waistPart,
    strength: strengthPart,
    trendWeightKg,
    waistChangeCm,
    liftsUp,
  });
}
