import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightObservation } from '../domain/WeightObservation';
import { compareStrings } from '../lang/compareStrings';
import { buildStrengthTrends } from './buildStrengthTrends';
import { calibrationDays } from './coachConstants';
import type { ModeRecommendation } from './ModeRecommendation';
import { MonthlyReport } from './MonthlyReport';
import type { RecompReview } from './RecompReview';
import { recompReviewOf } from './recompReviewOf';
import type { ReportEstimate } from './ReportEstimate';
import type { ReportEstimateGap } from './ReportEstimateGap';
import type { ReportLift } from './ReportLift';
import { ReportPeriod } from './ReportPeriod';
import type { ReportTargetChange } from './ReportTargetChange';
import type { TargetsRecord } from './TargetsRecord';
import { usableIntakeDays } from './usableIntakeDays';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * The report for `period` (MM-33), from stored history.
 *
 * With fewer whole days of food than the coach needs to start measuring
 * (`calibrationDays`) the report says the expenditure estimate could not be
 * measured, and why, instead of showing a number.
 */
export function buildMonthlyReport({
  period,
  intake,
  weights,
  waist,
  history,
  trend,
  workouts = [],
  exercises = [],
  recommendation,
}: {
  period: ReportPeriod;
  intake: readonly IntakeDay[];
  weights: readonly WeightObservation[];
  waist: readonly WaistObservation[];
  history: readonly TargetsRecord[];
  trend: readonly WeightTrendPoint[];
  workouts?: readonly Workout[];
  exercises?: readonly Exercise[];
  recommendation?: ModeRecommendation | undefined;
}): MonthlyReport {
  const inPeriod = (d: CalendarDate) => !d.isBefore(period.from) && !d.isAfter(period.to);

  const logged = intake.filter((d) => inPeriod(d.date) && d.kcal > 0);
  const whole = usableIntakeDays(logged);
  const weighIns = weights.filter((w) => inPeriod(w.date)).length;

  const sorted = [...history].sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  const inForceOn = (day: CalendarDate): TargetsRecord | undefined => {
    let found: TargetsRecord | undefined;
    for (const r of sorted) {
      if (r.effectiveFrom.isAfter(day)) break;
      found = r;
    }
    return found;
  };

  // Trend change: from the first point of the month to the last.
  const points = trend.filter((p) => inPeriod(p.date));
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const trendChange =
    weighIns >= 4 && points.length >= 2 && firstPoint !== undefined && lastPoint !== undefined
      ? lastPoint.levelKg - firstPoint.levelKg
      : undefined;

  // What the targets in force meant for the month.
  let rateSum = 0;
  let rateDays = 0;
  for (let i = 0; i < ReportPeriod.days; i++) {
    const record = inForceOn(period.from.addDays(i));
    if (record !== undefined) {
      rateSum += record.targets.weeklyRateFraction;
      rateDays++;
    }
  }
  const intended =
    rateDays === 0 || lastPoint === undefined
      ? undefined
      : ((rateSum / rateDays) * lastPoint.levelKg * ReportPeriod.days) / 7;

  let averageProtein: number | undefined;
  let averageProteinTarget: number | undefined;
  if (whole.length > 0) {
    averageProtein = whole.reduce((s, d) => s + d.proteinG, 0) / whole.length;
    let targetSum = 0;
    let targetDays = 0;
    for (const d of whole) {
      const record = inForceOn(d.date);
      if (record !== undefined) {
        targetSum += record.targets.proteinG;
        targetDays++;
      }
    }
    if (targetDays > 0) averageProteinTarget = targetSum / targetDays;
  }

  const waists = waist.filter((w) => inPeriod(w.date)).sort((a, b) => a.date.compareTo(b.date));
  const inMonth = sorted.filter((r) => inPeriod(r.effectiveFrom));

  let estimate: ReportEstimate | undefined;
  let gap: ReportEstimateGap | undefined;
  if (whole.length < calibrationDays) {
    gap = 'tooFewFoodDays';
  } else {
    const updated = inMonth.filter((r) => r.tdeeStatus === 'updated');
    const settled = updated[updated.length - 1];
    if (settled === undefined) {
      gap = 'notSettled';
    } else {
      estimate = { kcal: settled.tdeeKcal, sigmaKcal: settled.tdeeSigmaKcal };
    }
  }

  // Strength as it stood at the end of the month, so a report reread later
  // says what it said then.
  const lifts: ReportLift[] = [];
  for (const lift of buildStrengthTrends({ workouts, exercises, weights, today: period.to })) {
    const month = lift.points.filter((p) => inPeriod(p.date));
    const from = month[0];
    const to = month[month.length - 1];
    if (month.length >= 2 && from !== undefined && to !== undefined) {
      lifts.push({ name: lift.name, sessions: month.length, fromKg: from.trendKg, toKg: to.trendKg });
    }
  }
  lifts.sort((a, b) => {
    const sessions = b.sessions - a.sessions;
    return sessions !== 0 ? sessions : compareStrings(a.name, b.name);
  });

  // The recomp review that fell due in the month (MM-133): due on the
  // first day of the month it would have been shown, and read on the last,
  // when it had the most to go on.
  let recompReview: RecompReview | undefined;
  if (recommendation !== undefined) {
    const on = (day: CalendarDate, { full = true }: { full?: boolean } = {}) =>
      recompReviewOf({
        history,
        trend,
        waist: full ? waist : [],
        strengthTrends: full ? buildStrengthTrends({ workouts, exercises, weights, today: day }) : [],
        recommendation,
        today: day,
      });
    let shownUntil: CalendarDate | undefined;
    let dueInMonth = false;
    // A review already showing when the month began fell due in the month
    // before, and is in that report.
    let carriedOver: number | undefined;
    for (let i = 0; i < ReportPeriod.days; i++) {
      const day = period.from.addDays(i);
      // Whether a review is due depends only on the goal's history.
      const shown = on(day, { full: false });
      if (shown === undefined) {
        if (dueInMonth) break;
        continue;
      }
      if (!dueInMonth) {
        if (i === 0 && on(day.addDays(-1), { full: false })?.week === shown.week) {
          carriedOver = shown.week;
        }
        if (shown.week === carriedOver) continue;
        dueInMonth = true;
      }
      shownUntil = day;
    }
    if (shownUntil !== undefined) recompReview = on(shownUntil);
  }

  const targetChanges: ReportTargetChange[] = [];
  for (const r of inMonth) {
    if (r.explanation === undefined) continue;
    targetChanges.push({
      date: r.effectiveFrom,
      previousKcal: r.explanation.previousKcal,
      newKcal: r.targets.kcal,
      tdeeKcal: r.tdeeKcal,
      tdeeSigmaKcal: r.tdeeSigmaKcal,
      tdeeStatus: r.tdeeStatus,
      lines: r.explanation.lines,
    });
  }

  const firstWaist = waists[0];
  const lastWaist = waists[waists.length - 1];
  return new MonthlyReport({
    period,
    recompReview,
    workouts: workouts.filter((w) => !w.inProgress && inPeriod(w.date)).length,
    lifts,
    daysLogged: logged.length,
    completeDays: whole.length,
    weighIns,
    trendChangeKg: trendChange,
    intendedChangeKg: intended,
    averageProteinG: averageProtein,
    averageProteinTargetG: averageProteinTarget,
    waistFromCm: waists.length >= 2 ? firstWaist?.waistCm : undefined,
    waistToCm: waists.length >= 2 ? lastWaist?.waistCm : undefined,
    estimate,
    estimateGap: gap,
    targetChanges,
  });
}
