import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import type { UserSetup } from '../domain/UserSetup';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightObservation } from '../domain/WeightObservation';
import { compareStrings } from '../lang/compareStrings';
import { buildStrengthTrends } from './buildStrengthTrends';
import { calibrationDays } from './coachConstants';
import { estimateBodyFat } from './estimateBodyFat';
import type { EstimatedBodyFat } from './EstimatedBodyFat';
import { longestLoggingRunOf } from './longestLoggingRunOf';
import type { ModeRecommendation } from './ModeRecommendation';
import { MonthlyReport } from './MonthlyReport';
import { personalRecordsOf } from './personalRecordsOf';
import type { RecompReview } from './RecompReview';
import { recompReviewOf } from './recompReviewOf';
import type { ReportBodyFat } from './ReportBodyFat';
import type { ReportEstimate } from './ReportEstimate';
import type { ReportEstimateGap } from './ReportEstimateGap';
import type { ReportLift } from './ReportLift';
import { ReportPeriod } from './ReportPeriod';
import type { ReportPersonalRecord } from './ReportPersonalRecord';
import type { ReportTargetChange } from './ReportTargetChange';
import type { TargetsRecord } from './TargetsRecord';
import { usableIntakeDays } from './usableIntakeDays';
import { waistChangeOf } from './waistChangeOf';
import { WeightTrendModel } from './WeightTrendModel';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * The report for `period` (MM-33), from stored history.
 *
 * With fewer whole days of food than the coach needs to start measuring
 * (`calibrationDays`) the report says the expenditure estimate could not be
 * measured, and why, instead of showing a number.
 *
 * Without `setup` the report has no body fat (MM-450).
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
  pauses = [],
  recommendation,
  setup,
}: {
  period: ReportPeriod;
  intake: readonly IntakeDay[];
  weights: readonly WeightObservation[];
  waist: readonly WaistObservation[];
  history: readonly TargetsRecord[];
  trend: readonly WeightTrendPoint[];
  workouts?: readonly Workout[];
  exercises?: readonly Exercise[];
  pauses?: readonly Pause[];
  recommendation?: ModeRecommendation | undefined;
  setup?: UserSetup | undefined;
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
  const strength = buildStrengthTrends({ workouts, exercises, weights, today: period.to });
  const lifts: ReportLift[] = [];
  for (const lift of strength) {
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

  // The month's personal records (MM-92), each against every session of
  // the lift before it, in or before the month.
  const finished = workouts
    .filter((w) => !w.inProgress && inPeriod(w.date))
    .sort((a, b) => a.date.compareTo(b.date) || a.startedAt.getTime() - b.startedAt.getTime() || a.id - b.id);
  const recordsByWorkout = personalRecordsOf(strength);
  const personalRecords: ReportPersonalRecord[] = [];
  for (const w of finished) {
    for (const r of recordsByWorkout.get(w.id) ?? []) personalRecords.push({ ...r, date: w.date });
  }

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

  // The body-fat range from the user's measurements (MM-450), each end as it
  // stood on its day: the waist entries up to that day, and the trend weight
  // from the weigh-ins up to it (the last point of a smoother is the filter's,
  // so a later weigh-in cannot move it). Only a range that rests on the waist
  // has settled from measurements; the formula alone, or the user's own
  // figure, puts nothing about body fat in the report.
  const trendModel = new WeightTrendModel();
  const bodyFatOn = (day: CalendarDate): EstimatedBodyFat | undefined => {
    if (setup === undefined) return undefined;
    const upTo = trendModel.smooth(weights.filter((w) => !w.date.isAfter(day)), { through: day });
    const level = upTo[upTo.length - 1]?.levelKg;
    if (level === undefined) return undefined;
    const estimated = estimateBodyFat({ setup, trendWeightKg: level, waists: waist, today: day });
    return estimated.basis === 'waist' ? estimated : undefined;
  };
  const bodyFatAtEnd = bodyFatOn(period.to);
  // With an eating-disorder history the report shows no change in body fat
  // (MM-450, as weight-based rewards are withheld, MM-92): the end only.
  const bodyFat: ReportBodyFat | undefined =
    bodyFatAtEnd === undefined
      ? undefined
      : {
          end: bodyFatAtEnd,
          start: setup?.screening.eatingDisorderHistory === true ? undefined : bodyFatOn(period.from.addDays(-1)),
        };

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

  return new MonthlyReport({
    period,
    recompReview,
    workouts: finished.length,
    lifts,
    personalRecords,
    longestRunDays: longestLoggingRunOf({ from: period.from, to: period.to, wholeDays: whole.map((d) => d.date), pauses }),
    daysLogged: logged.length,
    completeDays: whole.length,
    weighIns,
    trendChangeKg: trendChange,
    intendedChangeKg: intended,
    averageProteinG: averageProtein,
    averageProteinTargetG: averageProteinTarget,
    // The waist over the month by the one rule (MM-155): the latest three entries against the three nearest its start.
    waistChange: waistChangeOf({ waist, asOf: period.to, days: ReportPeriod.days }),
    bodyFat,
    estimate,
    estimateGap: gap,
    targetChanges,
  });
}
