import type { CalendarDate } from '../domain/CalendarDate';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import { deficitStartOn } from './deficitStartOn';
import { ItemAnchor } from './ItemAnchor';
import type { ItemInsight } from './ItemInsight';
import { StrengthOnFatLossRule } from './StrengthOnFatLossRule';
import type { StrengthPoint } from './StrengthPoint';
import type { StrengthTrend } from './StrengthTrend';
import type { TargetsRecord } from './TargetsRecord';

/** How many sessions a point's smoothed value rests on: itself and those within the window before it. */
function pointsBehind(points: readonly StrengthPoint[], point: StrengthPoint): number {
  const index = points.indexOf(point);
  const window = points.slice(0, index).filter((p) => p.date.daysUntil(point.date) <= StrengthOnFatLossRule.maxGapDays);
  return Math.min(3, window.length + 1);
}

/**
 * The "strength on fat loss" insights under a workout's lifts (MM-377): a
 * lift with added weight whose smoothed estimated max (MM-77) at the
 * workout is at least `heldTolerance` below its value at the start of an
 * unbroken run of at least `minDeficitWeeks` whole weeks of fat-loss
 * targets, judged as of the workout's own date; "gone up" at `upBy` or more.
 * The weeks are the planned ones (`deficitStartOn`, with the restart a gap
 * or a pause set), every record of them in fat-loss mode: recomp is not fat
 * loss (the panel's NU-2). The baseline is the latest session within
 * `baselineWithinDays` either side of the start; both ends rest on at least
 * `minSmoothedPoints` sessions; at least `minSessions` on distinct days with
 * no gap over `maxGapDays` (the panel's ME-1 to ME-5). Bodyweight lifts are
 * left out: their estimate includes body weight (TR-9). Nothing is said
 * while progress is assessed as stalled: "fat-loss goal" means little then
 * (NU-3). A workout in progress takes the last finished session before it.
 */
export function strengthOnFatLossInsights({
  workout,
  trends,
  history,
  exercisesById,
  deficitRestartOn,
  progressStalled,
}: {
  workout: Workout;
  trends: readonly StrengthTrend[];
  history: readonly TargetsRecord[];
  exercisesById: ReadonlyMap<string, Exercise>;
  deficitRestartOn: CalendarDate | undefined;
  progressStalled: boolean;
}): ItemInsight[] {
  if (progressStalled) return [];
  const asOf = workout.date;
  const start = deficitStartOn(history, asOf, { restartOn: deficitRestartOn });
  if (start === undefined) return [];
  const weeks = Math.trunc(start.daysUntil(asOf) / 7);
  if (weeks < StrengthOnFatLossRule.minDeficitWeeks) return [];
  const run = history.filter((r) => !r.effectiveFrom.isAfter(asOf) && !r.effectiveFrom.isBefore(start));
  if (run.some((r) => r.mode !== 'fatLoss')) return [];
  const inForce = history.filter((r) => r.effectiveFrom.isBefore(start)).at(-1);
  if (inForce !== undefined && inForce.mode !== 'fatLoss' && inForce.targets.weeklyRateFraction < 0) return [];

  const found: ItemInsight[] = [];
  for (const entry of workout.exercises) {
    const exercise = exercisesById.get(entry.exerciseId);
    if (exercise === undefined || exercise.load === 'bodyweight') continue;
    const trend = trends.find((t) => t.exerciseId === entry.exerciseId);
    if (trend === undefined) continue;
    const points = trend.points.filter((p) => !p.date.isAfter(asOf));
    const latest = workout.inProgress
      ? points.filter((p) => p.date.isBefore(asOf) && p.date.daysUntil(asOf) <= StrengthOnFatLossRule.baselineWithinDays).at(-1)
      : points.find((p) => p.workoutId === workout.id);
    if (latest === undefined) continue;
    const near = points.filter(
      (p) => Math.abs(p.date.daysUntil(start)) <= StrengthOnFatLossRule.baselineWithinDays && pointsBehind(points, p) >= StrengthOnFatLossRule.minSmoothedPoints,
    );
    const baseline = near.at(-1);
    if (baseline === undefined || baseline === latest || baseline.date.isAfter(latest.date)) continue;
    if (pointsBehind(points, latest) < StrengthOnFatLossRule.minSmoothedPoints) continue;
    const between = points.filter((p) => !p.date.isBefore(baseline.date) && !p.date.isAfter(latest.date));
    const days = [...new Set(between.map((p) => p.date.epochDay))].sort((a, b) => a - b);
    if (days.length < StrengthOnFatLossRule.minSessions) continue;
    if (days.some((day, i) => i > 0 && day - (days[i - 1] as number) > StrengthOnFatLossRule.maxGapDays)) continue;
    const ratio = latest.trendKg / baseline.trendKg;
    if (ratio < 1 - StrengthOnFatLossRule.heldTolerance) continue;
    found.push({
      kind: 'strengthOnFatLoss',
      anchor: ItemAnchor.exercise(workout.id, entry.exerciseId),
      subject: entry.exerciseId,
      basis: 'pattern',
      figures: {
        fromKg: baseline.trendKg,
        toKg: latest.trendKg,
        heldDownToKg: baseline.trendKg * (1 - StrengthOnFatLossRule.heldTolerance),
        weeks,
        sessions: days.length,
        up: ratio >= 1 + StrengthOnFatLossRule.upBy ? 1 : 0,
        inProgress: workout.inProgress ? 1 : 0,
        startEpochDay: start.epochDay,
      },
      from: start,
      to: asOf,
    });
  }
  return found;
}
