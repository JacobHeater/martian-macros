import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import { Meal } from '../domain/Meal';
import type { WaistObservation } from '../domain/WaistObservation';
import type { WeightObservation } from '../domain/WeightObservation';
import type { FiberPattern } from './FiberPattern';
import { fiberInsight } from './fiberInsight';
import { Insight } from './Insight';
import { InsightPriority } from './InsightPriority';
import { InsightRationing } from './InsightRationing';
import { InsightRule } from './InsightRule';
import { ProteinSpreadRule } from './ProteinSpreadRule';
import { shortSleep } from './shortSleep';
import type { SleepAverage } from './SleepAverage';
import type { SodiumPattern } from './SodiumPattern';
import type { StallAssessment } from './StallAssessment';
import type { TargetsRecord } from './TargetsRecord';
import { usableIntakeDays } from './usableIntakeDays';
import { waistChangeOf } from './waistChangeOf';
import { WeekPatternRule } from './WeekPatternRule';
import type { WeightTrendPoint } from './WeightTrendPoint';

const mainMeals: readonly Meal[] = ['breakfast', 'lunch', 'dinner'];
const upToSeven = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * Every insight the catalog's rules produce from the data up to `through`,
 * highest priority first (MM-141). Rationing is applied afterwards by
 * `selectInsight`.
 *
 * Each rule is a pattern over `InsightRationing.patternDays` days resting on
 * at least `InsightRationing.minimumBasisDays` days of data, so nothing here
 * can be about a single day or a single weigh-in. For a user with an
 * eating-disorder history (`limitToProteinAndLogging`) rules about weight,
 * and about intake other than protein and logging, are left out entirely.
 */
export function findInsights({
  through,
  intake,
  weights,
  history,
  stall,
  mealProtein = new Map(),
  sodium,
  trend = [],
  waist = [],
  limitToProteinAndLogging = false,
  sleepAverage,
  fiber,
}: {
  through: CalendarDate;
  intake: readonly IntakeDay[];
  weights: readonly WeightObservation[];
  history: readonly TargetsRecord[];
  stall?: StallAssessment | undefined;
  mealProtein?: ReadonlyMap<CalendarDate, ReadonlyMap<Meal, number>>;
  /** The sodium limit and each day's sodium; absent when no limit is set (MM-312). */
  sodium?: SodiumPattern | undefined;
  /** The smoothed weight trend and the tape, for the waist against the scale. */
  trend?: readonly WeightTrendPoint[];
  waist?: readonly WaistObservation[];
  limitToProteinAndLogging?: boolean;
  /** The fourteen-night average from the nights recorded (MM-250); undefined with none. */
  sleepAverage?: SleepAverage | undefined;
  /** Each day's entries, the sex and the check-ins, at Full detail only (MM-126). */
  fiber?: FiberPattern | undefined;
}): Insight[] {
  const days = InsightRationing.patternDays;
  const minimum = InsightRationing.minimumBasisDays;
  const from = through.addDays(1 - days);
  const inPeriod = (d: CalendarDate) => !d.isBefore(from) && !d.isAfter(through);

  const logged = intake.filter((d) => inPeriod(d.date) && d.kcal > 0);
  const whole = usableIntakeDays(logged);
  const found: Insight[] = [];
  const add = (rule: InsightRule, figures: Record<string, number>) => {
    found.push(new Insight({ rule, from, to: through, figures }));
  };

  // More than a third of logged days are partial (MM-27).
  const partial = logged.length - whole.length;
  if (logged.length >= minimum && partial * 3 > logged.length) {
    add('partialDays', { loggedDays: logged.length, partialDays: partial });
  }

  // More than half the calories on whole days were estimated (MM-150).
  if (whole.length >= minimum) {
    const kcal = whole.reduce((s, d) => s + d.kcal, 0);
    const estimated = whole.reduce((s, d) => s + d.kcal * d.estimatedShare, 0);
    if (kcal > 0 && estimated / kcal > 0.5) {
      add('estimatesRising', { wholeDays: whole.length, estimatedShare: estimated / kcal });
    }
  }

  // Fewer than four weigh-ins a week, for someone who does weigh in.
  const weighIns = weights.filter((w) => inPeriod(w.date)).length;
  const everWeighedBefore = weights.some((w) => w.date.isBefore(from));
  if (everWeighedBefore && weighIns < Math.trunc((4 * days) / 7)) {
    add('weighInTiming', { weighIns });
  }

  if (stall !== undefined && stall.status === 'stalled') {
    found.push(new Insight({ rule: 'stall', from: through.addDays(1 - stall.windowDays), to: through, stall }));
  }

  // The protein minimum was met on fewer than half of whole days (MM-121).
  const sorted = [...history].sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  const recordOn = (day: CalendarDate): TargetsRecord | undefined => {
    let value: TargetsRecord | undefined;
    for (const r of sorted) {
      if (r.effectiveFrom.isAfter(day)) break;
      value = r;
    }
    return value;
  };
  const minimumOn = (day: CalendarDate): number | undefined => recordOn(day)?.targets.proteinMinimumG;
  let judged = 0;
  let met = 0;
  let shortfall = 0;
  const missedDays: CalendarDate[] = [];
  for (const d of whole) {
    const min = minimumOn(d.date);
    if (min === undefined) continue;
    judged++;
    if (d.proteinG >= min) {
      met++;
    } else {
      shortfall += min - d.proteinG;
      missedDays.push(d.date);
    }
  }
  if (judged >= minimum && met * 2 < judged) {
    add('proteinShort', { wholeDays: judged, metDays: met, averageShortfallG: shortfall / (judged - met) });
  }

  // Known sodium over the limit on more than half of the whole days since it
  // was set that can be judged (MM-312). A day over is over whatever is
  // missing; a day under counts only when enough of it states sodium.
  if (sodium !== undefined) {
    let over = 0;
    let judgedSodium = 0;
    let leftOut = 0;
    for (const d of whole) {
      if (d.date.isBefore(sodium.since)) continue;
      const day = sodium.days.get(d.date);
      const verdict = day === undefined ? 'unknown' : day.against(sodium.limitMg);
      if (verdict === 'unknown') {
        leftOut++;
        continue;
      }
      judgedSodium++;
      if (verdict === 'over') over++;
    }
    if (judgedSodium >= minimum && over * 2 > judgedSodium) {
      add('sodiumOverLimit', { overDays: over, judgedDays: judgedSodium, leftOutDays: leftOut, limitMg: sodium.limitMg });
    }
  }

  // On most of the days the minimum was missed, one main meal had almost
  // no protein (MM-125). The earliest such meal is named.
  if (judged >= minimum && met * 2 < judged) {
    for (const meal of mainMeals) {
      const low = missedDays.filter((day) => {
        const byMeal = mealProtein.get(day);
        return byMeal !== undefined && (byMeal.get(meal) ?? 0) < ProteinSpreadRule.almostNoneG;
      }).length;
      if (low * 2 > missedDays.length) {
        add('proteinByMeal', { meal: Meal.values.indexOf(meal), missedDays: missedDays.length, lowDays: low });
        break;
      }
    }
  }

  // Weekend days average a fifth of the target or more above weekdays.
  const average = (of: readonly IntakeDay[]) => of.reduce((s, d) => s + d.kcal, 0) / of.length;
  const weekend = whole.filter((d) => d.date.isWeekend);
  const weekdays = whole.filter((d) => !d.date.isWeekend);
  const targeted = whole.map((d) => recordOn(d.date)?.targets.kcal).filter((k): k is number => k !== undefined);
  if (
    whole.length >= minimum &&
    weekend.length >= WeekPatternRule.minimumWeekendDays &&
    weekdays.length >= WeekPatternRule.minimumWeekdays &&
    targeted.length === whole.length
  ) {
    const target = targeted.reduce((s, k) => s + k, 0) / targeted.length;
    const excess = average(weekend) - average(weekdays);
    if (excess >= WeekPatternRule.weekendExcessOfTarget * target) {
      add('weekendHigher', {
        weekdayDays: weekdays.length,
        weekendDays: weekend.length,
        weekdayAverageKcal: average(weekdays),
        weekendAverageKcal: average(weekend),
        targetKcal: target,
      });
    }
  }

  // The waist is down beyond its noise while the trend weight held. In
  // recomp the recomp signal (MM-32) says this already.
  const current = sorted[sorted.length - 1];
  const start = trend.find((p) => p.date === from);
  const end = trend.find((p) => p.date === through);
  if (current?.mode !== 'recomp' && start !== undefined && end !== undefined) {
    const weightChange = end.levelKg - start.levelKg;
    const flat = Math.abs(weightChange) <= Math.sqrt(start.levelVariance + end.levelVariance);
    const change = flat ? waistChangeOf({ waist, asOf: through, days }) : undefined;
    if (change?.direction === 'down') {
      add('waistAgainstWeight', { waistFromCm: change.fromCm, waistToCm: change.toCm, weightChangeKg: weightChange });
    }
  }

  // One weekday was the unlogged day, or the highest day, in both weeks.
  if (days === 14) {
    const halves = [0, 7].map((offset) => {
      const first = from.addDays(offset);
      const last = first.addDays(6);
      const within = (d: CalendarDate) => !d.isBefore(first) && !d.isAfter(last);
      const loggedDates = new Set(logged.filter((d) => within(d.date)).map((d) => d.date));
      const wholeDays = whole.filter((d) => within(d.date));
      const unlogged = upToSeven.map((i) => first.addDays(i)).filter((d) => !loggedDates.has(d));
      // The highest day stands out: alone at the top, and well above the rest.
      const top = wholeDays.reduce<IntakeDay | undefined>((h, d) => (h === undefined || d.kcal > h.kcal ? d : h), undefined);
      const rest = wholeDays.filter((d) => d !== top);
      const target = top === undefined ? undefined : recordOn(top.date)?.targets.kcal;
      const standsOut =
        top !== undefined &&
        target !== undefined &&
        rest.length > 0 &&
        top.kcal - average(rest) >= WeekPatternRule.highestDayExcessOfTarget * target &&
        rest.every((d) => d.kcal < top.kcal);
      return { loggedDays: loggedDates.size, wholeDays: wholeDays.length, unlogged, highest: standsOut ? top : undefined };
    });
    const [one, two] = halves as [(typeof halves)[0], (typeof halves)[0]];
    const enough = (count: number) => count >= WeekPatternRule.minimumDaysPerWeek;
    const unloggedBoth = one.unlogged
      .map((d) => d.weekday)
      .find((weekday) => two.unlogged.some((d) => d.weekday === weekday));
    if (unloggedBoth !== undefined && enough(one.loggedDays) && enough(two.loggedDays)) {
      add('consistentDay', { weekday: unloggedBoth, unlogged: 1, weeks: 2 });
    } else if (
      one.highest !== undefined &&
      two.highest !== undefined &&
      one.highest.date.weekday === two.highest.date.weekday &&
      enough(one.wholeDays) &&
      enough(two.wholeDays)
    ) {
      add('consistentDay', {
        weekday: one.highest.date.weekday,
        unlogged: 0,
        weeks: 2,
        averageKcal: (one.highest.kcal + two.highest.kcal) / 2,
      });
    }
  }

  // Sleep averaged short over the last fourteen recorded nights (MM-252).
  if (sleepAverage !== undefined && shortSleep(sleepAverage)) {
    found.push(
      new Insight({
        rule: 'shortSleep',
        from: sleepAverage.from,
        to: sleepAverage.to,
        figures: { averageMinutes: sleepAverage.averageMinutes, nights: sleepAverage.nights },
      }),
    );
  }

  // On a deficit, fiber well under the guide and hunger hard or unasked (MM-126).
  if (fiber !== undefined) {
    const insight = fiberInsight({ pattern: fiber, whole, from, through, current: recordOn(through) });
    if (insight !== undefined) found.push(insight);
  }

  const allowed = found.filter(
    (i) => !(limitToProteinAndLogging && (InsightRule.aboutWeight(i.rule) || InsightRule.otherIntake(i.rule))),
  );
  // A stable sort by priority keeps the catalog order within a priority.
  const priority = (insight: Insight) => InsightPriority.index(InsightRule.priority(insight.rule));
  return allowed
    .map((insight, index) => [index, insight] as const)
    .sort((a, b) => {
      const p = priority(a[1]) - priority(b[1]);
      return p !== 0 ? p : a[0] - b[0];
    })
    .map(([, insight]) => insight);
}
