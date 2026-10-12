import type { CalendarDate } from '../domain/CalendarDate';
import type { GoalMode } from '../domain/GoalMode';
import type { WaistObservation } from '../domain/WaistObservation';
import type { MeasuredChange } from './MeasuredChange';
import type { ModeRecommendation } from './ModeRecommendation';
import type { RecompMeasure } from './RecompMeasure';
import { RecompReview } from './RecompReview';
import type { RecompVerdict } from './RecompVerdict';
import type { StrengthTrend } from './StrengthTrend';
import type { TargetsRecord } from './TargetsRecord';
import { waistChangeOf } from './waistChangeOf';
import { WaistRule } from './WaistRule';
import type { WeightTrendPoint } from './WeightTrendPoint';

const shownForDays = 14;

/**
 * The recomp review due on `today`, or undefined when none is (MM-133).
 *
 * A review falls due 8 and 12 weeks into an unbroken stretch on recomp,
 * then every 8 weeks, and stays for 14 days. It reads the stretch
 * up to today, 12 weeks of it at most, and each signal against its own
 * noise. The figures are judgments, as in the recomp signal (MM-32):
 *
 * - **Waist**: the shared change function over the period
 *   (`waistChangeOf`, MM-155). A verdict needs four entries in the period
 *   and a measurement at each end.
 * - **Strength**: a lift rose or fell when its smoothed estimated max
 *   moved 2.5% over the period. It counts when trained in the last 14
 *   days and in six different weeks of the period; a verdict needs two.
 *   Up is two lifts up and more up than down; down likewise; otherwise
 *   held.
 * - **Weight**: the trend's change over the period.
 *
 * The verdict is the first that applies: weight down more than 2% with
 * strength not down, a slow cut; waist down with strength not down,
 * working; no clear change in waist with strength up, probably working;
 * anything else, not working. At the 8 week review "not working" is "too
 * early to tell", unless the person is lean and trained, where the odds
 * were poor from the start and saying so early is kinder.
 */
export function recompReviewOf({
  history,
  trend,
  waist,
  strengthTrends,
  recommendation,
  today,
}: {
  history: readonly TargetsRecord[];
  trend: readonly WeightTrendPoint[];
  waist: Iterable<WaistObservation>;
  strengthTrends: Iterable<StrengthTrend>;
  recommendation: ModeRecommendation;
  today: CalendarDate;
}): RecompReview | undefined {
  const ago = (date: CalendarDate) => date.daysUntil(today);
  const allWaist = [...waist];

  // The unbroken stretch on recomp that is still running.
  const records = history
    .filter((record) => !record.effectiveFrom.isAfter(today))
    .sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  const latestRecord = records[records.length - 1];
  if (latestRecord === undefined || latestRecord.mode !== 'recomp') return undefined;
  let since = latestRecord.effectiveFrom;
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i] as TargetsRecord;
    if (record.mode !== 'recomp') break;
    since = record.effectiveFrom;
  }
  const days = ago(since);

  // The latest review reached: 8, 12, 20, 28... weeks.
  let week: number | undefined;
  for (let w = 8; w * 7 <= days; w += w === 8 ? 4 : 8) {
    week = w;
  }
  if (week === undefined || days - week * 7 >= shownForDays) return undefined;
  const period = days > 84 ? 84 : days;

  // Waist: the one answer every feature gets (MM-155).
  const inPeriod = allWaist.filter(
    (w) => ago(w.date) >= 0 && ago(w.date) <= period + WaistRule.baselineWithinDays,
  );
  const measured = inPeriod.length < 4 ? undefined : waistChangeOf({ waist: allWaist, asOf: today, days: period });
  const waistChange = measured?.direction;
  const waistChangeCm = measured?.changeCm;

  // Strength.
  const liftsUp: string[] = [];
  const liftsDown: string[] = [];
  let judged = 0;
  for (const lift of strengthTrends) {
    const points = lift.points.filter((point) => ago(point.date) >= 0 && ago(point.date) <= period);
    const lastPoint = points[points.length - 1];
    if (lastPoint === undefined || ago(lastPoint.date) > 14) continue;
    const weeks = new Set(points.map((point) => Math.trunc(ago(point.date) / 7)));
    if (weeks.size < 6) continue;
    const change = lift.changeOverDays(period - ago(lastPoint.date));
    const latest = lift.points[lift.points.length - 1];
    if (change === undefined || latest === undefined) continue;
    const from = latest.trendKg - change;
    if (from <= 0) continue;
    judged++;
    const fraction = change / from;
    if (fraction >= 0.025) liftsUp.push(lift.name);
    if (fraction <= -0.025) liftsDown.push(lift.name);
  }
  const strength: MeasuredChange | undefined =
    judged < 2
      ? undefined
      : liftsUp.length >= 2 && liftsUp.length > liftsDown.length
        ? 'up'
        : liftsDown.length >= 2 && liftsDown.length > liftsUp.length
          ? 'down'
          : 'noClearChange';

  // Weight.
  let weightChange: number | undefined;
  const at = (daysAgo: number) => trend.find((point) => ago(point.date) === daysAgo);
  const now = at(0);
  const then = at(period);
  if (now !== undefined && then !== undefined && then.levelKg > 0) {
    weightChange = (now.levelKg - then.levelKg) / then.levelKg;
  }

  const missing: RecompMeasure[] = [];
  if (weightChange === undefined) missing.push('weight');
  if (waistChange === undefined) missing.push('waist');
  if (strength === undefined) missing.push('strength');

  let verdict: RecompVerdict | undefined;
  if (weightChange !== undefined && waistChange !== undefined && strength !== undefined) {
    const strengthHeld = strength !== 'down';
    if (weightChange < -0.02 && strengthHeld) {
      verdict = 'slowCut';
    } else if (waistChange === 'down' && strengthHeld) {
      verdict = 'working';
    } else if (waistChange === 'noClearChange' && strength === 'up') {
      verdict = 'probablyWorking';
    } else {
      const leanAndTrained = recommendation.reason === 'leanAndTrained';
      verdict = week === 8 && !leanAndTrained ? 'tooEarly' : 'notWorking';
    }
  }

  // A deficit is never suggested to someone it is not allowed for.
  const noDeficit = recommendation.reason === 'deficitNotAllowed' || recommendation.reason === 'underweight';
  let nextGoal: GoalMode | undefined;
  if (verdict === 'slowCut') {
    nextGoal = noDeficit ? undefined : 'fatLoss';
  } else if (verdict === 'notWorking') {
    nextGoal = recommendation.mode === 'recomp' ? undefined : recommendation.mode;
  }

  return new RecompReview({
    week,
    periodDays: period,
    verdict,
    missing,
    waistMeasurements: inPeriod.length,
    waist: waistChange,
    waistChangeCm,
    strength,
    liftsUp,
    liftsDown,
    weightChangeFraction: weightChange,
    nextGoal,
  });
}
