import type { StrengthTrend } from '../engine/StrengthTrend';
import { Fmt } from './Fmt';
import { liftChangeWords } from './liftChangeWords';
import { setText } from './setText';

/**
 * A lift in one line (MM-344), saying what its figure is: the smoothed
 * estimated max, with body weight for a bodyweight exercise, and its change
 * over four weeks. For an exercise since deleted, that it was, and when it
 * was last logged, which tells two of them apart (MM-348). With the weight
 * hidden (MM-118) a bodyweight lift's estimate, which carries the body
 * weight, is not said: its best set is, and its change in words.
 */
export function liftSummary(trend: StrengthTrend, fmt: Fmt): string {
  if (trend.exercise === undefined) {
    const last = trend.lastLoggedOn === undefined ? [] : [`last logged ${Fmt.shortDay(trend.lastLoggedOn)}`];
    return ['Exercise deleted, sets kept', ...last].join(' · ');
  }
  const latest = trend.points[trend.points.length - 1];
  if (latest === undefined) return 'No usable estimate yet';
  const change = trend.changeOverDays(28);
  if (trend.exercise.load === 'bodyweight' && fmt.weightHidden) {
    const best = latest.bestSet === undefined ? 'Best set logged' : `Best set ${setText(latest.bestSet, fmt, 'bodyweight')}`;
    return `${best} · ${change === undefined ? '4-week change not ready yet' : `${liftChangeWords(change)} over 4 weeks`}`;
  }
  const max = `Est. max ${fmt.load(latest.trendKg)}${trend.exercise.load === 'bodyweight' ? ' with body weight' : ''}`;
  return `${max} · ${change === undefined ? '4-week change not ready yet' : `${fmt.loadDelta(change)} in 4 weeks`}`;
}
