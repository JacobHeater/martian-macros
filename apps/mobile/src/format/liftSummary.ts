import type { StrengthTrend } from '../engine/StrengthTrend';
import { Fmt } from './Fmt';

/**
 * A lift in one line (MM-344), saying what its figure is: the smoothed
 * estimated max, with body weight for a bodyweight exercise, and its change
 * over four weeks. For an exercise since deleted, that it was, and when it
 * was last logged, which tells two of them apart (MM-348).
 */
export function liftSummary(trend: StrengthTrend, fmt: Fmt): string {
  if (trend.exercise === undefined) {
    const last = trend.lastLoggedOn === undefined ? [] : [`last logged ${Fmt.shortDay(trend.lastLoggedOn)}`];
    return ['Exercise deleted, sets kept', ...last].join(' · ');
  }
  const latest = trend.points[trend.points.length - 1];
  if (latest === undefined) return 'No usable estimate yet';
  const max = `Est. max ${fmt.weight(latest.trendKg)}${trend.exercise.load === 'bodyweight' ? ' with body weight' : ''}`;
  const change = trend.changeOverDays(28);
  return `${max} · ${change === undefined ? '4-week change not ready yet' : `${fmt.weightDelta(change)} in 4 weeks`}`;
}
