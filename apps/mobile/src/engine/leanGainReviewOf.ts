import type { BiologicalSex } from '../domain/BiologicalSex';
import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistObservation } from '../domain/WaistObservation';
import { LeanGainReview } from './LeanGainReview';
import { LeanGainRule } from './LeanGainRule';
import type { LeanGainStopReason } from './LeanGainStopReason';
import type { StrengthTrend } from './StrengthTrend';
import type { TargetsRecord } from './TargetsRecord';
import { waistChangeOf } from './waistChangeOf';
import { WaistRule } from './WaistRule';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * What the coach says about the lean gain running on `today` (MM-129), or
 * undefined when the goal is not lean gain or there is nothing to say.
 * Every line is advice: none changes a target, and the goal stays the
 * user's to change.
 *
 * - **Too fast**: the trend's pace over the last `fastGainWindowDays`,
 *   after the first `fastGainSettleDays` of the gain, above
 *   `fastGainFactor` times the pace the targets aim for. The check-ins
 *   already bring calories down a step at a time; this says why.
 * - **Fat-heavy**: from `fatHeavyMinWeeks`, the waist up beyond its noise
 *   over the stretch (`waistChangeOf`, MM-155) from at least
 *   `minWaistEntries` entries, by more than `fatHeavyWaistCmPerKg` per
 *   kilogram of trend weight gained.
 * - **Time to stop**, the first that applies: estimated body fat at
 *   `stopBodyFatPercent`; the waist up `stopWaistRiseFraction` beyond its
 *   noise; `stopWeeks` on the goal.
 * - **Strength flat**: from `strengthMinWeeks`, trend weight up by
 *   `strengthWeightGainFraction` or more and no judged lift's smoothed
 *   estimated max (MM-77) up `strengthUpFraction`. Bodyweight lifts are left
 *   out: their estimate rises with body weight.
 *
 * With `weightSignals` false (an eating-disorder history), only the weeks
 * line is said: the others are about weight, waist or body fat.
 */
export function leanGainReviewOf({
  history,
  trend,
  waist,
  strengthTrends,
  sex,
  bodyFatPercent,
  today,
  weightSignals = true,
}: {
  history: readonly TargetsRecord[];
  trend: readonly WeightTrendPoint[];
  waist: Iterable<WaistObservation>;
  strengthTrends: Iterable<StrengthTrend>;
  sex: BiologicalSex;
  /** The point estimate, as MM-12 judges "high". */
  bodyFatPercent: number;
  today: CalendarDate;
  weightSignals?: boolean;
}): LeanGainReview | undefined {
  const ago = (date: CalendarDate) => date.daysUntil(today);

  // The unbroken stretch on lean gain that is still running.
  const records = history
    .filter((record) => !record.effectiveFrom.isAfter(today))
    .sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  const latest = records[records.length - 1];
  if (latest === undefined || latest.mode !== 'leanGain') return undefined;
  let since = latest.effectiveFrom;
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i] as TargetsRecord;
    if (record.mode !== 'leanGain') break;
    since = record.effectiveFrom;
  }
  const days = ago(since);
  const weeks = Math.trunc(days / 7);
  const intended = latest.targets.weeklyRateFraction;
  const at = (daysAgo: number) => trend.find((point) => ago(point.date) === daysAgo);
  const now = at(0);

  // Too fast: three weeks of trend after the first week, against the aim.
  let gainFraction: number | undefined;
  const window = LeanGainRule.fastGainWindowDays;
  const windowStart = at(window);
  if (days >= window + LeanGainRule.fastGainSettleDays && now !== undefined && windowStart !== undefined && windowStart.levelKg > 0) {
    gainFraction = (now.levelKg - windowStart.levelKg) / windowStart.levelKg / (window / 7);
  }
  const gainingFast =
    weightSignals && gainFraction !== undefined && intended > 0 && gainFraction > LeanGainRule.fastGainFactor * intended;

  // Weight over the stretch.
  const start = at(days);
  const weightChangeKg = now !== undefined && start !== undefined ? now.levelKg - start.levelKg : undefined;

  // Waist over the stretch: the one answer every feature gets (MM-155).
  const allWaist = [...waist];
  const waistEntries = allWaist.filter((w) => ago(w.date) >= 0 && ago(w.date) <= days + WaistRule.baselineWithinDays).length;
  const measured = days > 0 ? waistChangeOf({ waist: allWaist, asOf: today, days }) : undefined;
  const waistUp = measured !== undefined && measured.direction === 'up';
  const fatHeavy =
    weightSignals &&
    weeks >= LeanGainRule.fatHeavyMinWeeks &&
    waistEntries >= LeanGainRule.minWaistEntries &&
    waistUp &&
    weightChangeKg !== undefined &&
    weightChangeKg > 0 &&
    measured.changeCm / weightChangeKg > LeanGainRule.fatHeavyWaistCmPerKg;
  const waistRiseFraction = waistUp && measured.fromCm > 0 ? measured.changeCm / measured.fromCm : undefined;

  // Time to stop: the first that applies.
  let stop: LeanGainStopReason | undefined;
  if (weightSignals && bodyFatPercent >= LeanGainRule.stopBodyFatPercent[sex]) stop = 'bodyFat';
  else if (weightSignals && waistRiseFraction !== undefined && waistRiseFraction >= LeanGainRule.stopWaistRiseFraction) {
    stop = 'waist';
  } else if (weeks >= LeanGainRule.stopWeeks) stop = 'weeks';

  // Strength against the weight.
  let judged = 0;
  let up = 0;
  for (const lift of strengthTrends) {
    if (lift.exercise?.load === 'bodyweight') continue;
    const points = lift.points.filter((point) => ago(point.date) >= 0 && ago(point.date) <= days);
    const last = points[points.length - 1];
    if (last === undefined || ago(last.date) > LeanGainRule.strengthRecentDays) continue;
    if (points.length < LeanGainRule.strengthMinSessions) continue;
    const span = days - ago(last.date);
    if (span <= 0) continue;
    const change = lift.changeOverDays(span);
    if (change === undefined) continue;
    const baselineKg = last.trendKg - change;
    if (baselineKg <= 0) continue;
    judged++;
    if (change / baselineKg >= LeanGainRule.strengthUpFraction) up++;
  }
  const strengthFlat =
    weightSignals &&
    weeks >= LeanGainRule.strengthMinWeeks &&
    intended > 0 &&
    start !== undefined &&
    weightChangeKg !== undefined &&
    weightChangeKg >= LeanGainRule.strengthWeightGainFraction * start.levelKg &&
    judged > 0 &&
    up === 0;

  const review = new LeanGainReview({
    startedOn: since,
    days,
    intendedFraction: intended,
    gainFraction,
    gainingFast,
    weightChangeKg,
    waistChangeCm: measured?.changeCm,
    waistEntries,
    fatHeavy,
    stop,
    bodyFatPercent,
    waistRiseFraction,
    strengthFlat,
    liftsJudged: judged,
  });
  return review.anything ? review : undefined;
}
