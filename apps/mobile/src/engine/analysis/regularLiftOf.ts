import type { CalendarDate } from '../../domain/CalendarDate';
import { StrengthOnFatLossRule } from '../StrengthOnFatLossRule';
import type { StrengthPoint } from '../StrengthPoint';
import type { StrengthTrend } from '../StrengthTrend';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * A lift that can carry a rising or stalled claim in a span (MM-609), with
 * its first and last session there; undefined otherwise. It has added
 * weight (a bodyweight or assisted lift's estimate carries the body weight),
 * a known exercise, at least `sessions` sessions on distinct days over at
 * least `days` days, no gap over 28 days (MM-77's window), and a session in
 * the last `recentDays`. Its points already leave out sets over 12
 * effective reps, at 5 or more in reserve, or without reps (MM-613).
 */
export function regularLiftOf(
  trend: StrengthTrend,
  from: CalendarDate,
  asOf: CalendarDate,
): { readonly first: StrengthPoint; readonly last: StrengthPoint; readonly sessions: number } | undefined {
  const rule = TrainingAnalysisRule.strength;
  if (trend.exercise === undefined || trend.exercise.load === 'bodyweight') return undefined;
  const points = trend.points.filter((p) => !p.date.isBefore(from) && !p.date.isAfter(asOf));
  const first = points[0];
  const last = points.at(-1);
  if (first === undefined || last === undefined) return undefined;
  if (last.date.daysUntil(asOf) >= rule.recentDays || first.date.daysUntil(last.date) < rule.days) return undefined;
  const days = [...new Set(points.map((p) => p.date.epochDay))].sort((a, b) => a - b);
  if (days.length < rule.sessions) return undefined;
  if (days.some((day, i) => i > 0 && day - (days[i - 1] as number) > StrengthOnFatLossRule.maxGapDays)) return undefined;
  return { first, last, sessions: days.length };
}
