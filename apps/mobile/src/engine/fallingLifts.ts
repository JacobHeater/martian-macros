import type { CalendarDate } from '../domain/CalendarDate';
import type { FallingLift } from './FallingLift';
import { ReliefRule } from './ReliefRule';
import type { StrengthTrend } from './StrengthTrend';

/**
 * The lifts whose smoothed estimated max (MM-77) is down `strengthDrop` or
 * more over the last `strengthWindowDays`, each trained on at least
 * `strengthSessions` distinct days within them (MM-117). The start is the
 * latest session on or before the window opens, no more than
 * `strengthBaselineWithinDays` before it; with none, the lift is not judged.
 * Smoothed, so one bad session is not a fall. Bodyweight lifts are left out:
 * their estimate carries body weight, which falls on a cut (TR-9, MM-377).
 */
export function fallingLifts(trends: readonly StrengthTrend[], today: CalendarDate): readonly FallingLift[] {
  const opens = today.addDays(-ReliefRule.strengthWindowDays);
  const found: FallingLift[] = [];
  for (const trend of trends) {
    if (trend.exercise === undefined || trend.exercise.load === 'bodyweight') continue;
    const points = trend.points.filter((p) => !p.date.isAfter(today));
    const inWindow = points.filter((p) => p.date.isAfter(opens));
    const sessions = new Set(inWindow.map((p) => p.date.epochDay)).size;
    const latest = inWindow.at(-1);
    if (latest === undefined || sessions < ReliefRule.strengthSessions) continue;
    const start = points.filter((p) => !p.date.isAfter(opens)).at(-1);
    if (start === undefined || start.date.daysUntil(opens) > ReliefRule.strengthBaselineWithinDays) continue;
    if (latest.trendKg <= start.trendKg * (1 - ReliefRule.strengthDrop)) {
      found.push({ exerciseId: trend.exerciseId, name: trend.name, fromKg: start.trendKg, toKg: latest.trendKg, sessions });
    }
  }
  return found;
}
