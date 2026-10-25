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
import { WeighProteinRule } from './WeighProteinRule';
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
 * can be about a single day or a single weigh-in. The unlogged weekday reads
 * the last four weeks and the weekend the last five calendar weeks
 * (`WeekPatternRule`, MM-614, MM-615), so `intake` reaches back that far. A shaped week (MM-124) is
 * read against its plan (`plannedShare`): which days are whole, as the
 * expenditure estimate judges them, and how high a day ran, so planned lower
 * days are not partial and planned higher days are not a pattern to point
 * out. For a user with an eating-disorder history
 * (`limitToProteinAndLogging`) rules about weight, and about intake other
 * than protein and logging, are left out entirely.
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
  plannedShare,
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
  /** The share of the flat figure planned for each day (MM-124); every day flat without it. */
  plannedShare?: ((date: CalendarDate) => number) | undefined;
}): Insight[] {
  const days = InsightRationing.patternDays;
  const minimum = InsightRationing.minimumBasisDays;
  const from = through.addDays(1 - days);
  const inPeriod = (d: CalendarDate) => !d.isBefore(from) && !d.isAfter(through);

  const logged = intake.filter((d) => inPeriod(d.date) && d.kcal > 0);
  const whole = usableIntakeDays(logged, { plannedShare });
  const found: Insight[] = [];
  const add = (rule: InsightRule, figures: Record<string, number>, since: CalendarDate = from) => {
    found.push(new Insight({ rule, from: since, to: through, figures }));
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

  // Most protein on whole days was logged by palm, in a goal where protein
  // matters (MM-46). Weighing food is not asked of a user with an
  // eating-disorder history.
  const goal = sorted[sorted.length - 1]?.mode;
  if (!limitToProteinAndLogging && whole.length >= minimum && goal !== undefined && WeighProteinRule.modes.includes(goal)) {
    const protein = whole.reduce((s, d) => s + d.proteinG, 0);
    const byPalm = whole.reduce((s, d) => s + d.proteinG * d.palmProteinShare, 0);
    if (protein > 0 && byPalm / protein > WeighProteinRule.palmProteinShare) {
      add('weighProtein', { wholeDays: whole.length, palmProteinShare: byPalm / protein });
    }
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

  // Weekends a fifth of the target or more above weekdays, each day read against its plan (MM-124). Each weekend is
  // paired with its own Monday-to-Sunday week, and the weeks must agree (MM-615): at least three weeks all higher, or
  // five with four in five higher. One big Saturday is one week, not a pattern.
  const asPlanned = (d: IntakeDay) => {
    const share = plannedShare?.(d.date) ?? 1;
    return share > 0 ? d.kcal / share : d.kcal;
  };
  const average = (of: readonly IntakeDay[]) => of.reduce((s, d) => s + d.kcal, 0) / of.length;
  const averageAsPlanned = (of: readonly IntakeDay[]) => of.reduce((s, d) => s + asPlanned(d), 0) / of.length;
  const targetOf = (of: readonly IntakeDay[]) => of.reduce((s, d) => s + (recordOn(d.date)?.targets.kcal ?? 0), 0) / of.length;
  const latestMonday = through.addDays(-((through.weekday + 6) % 7));
  const weekendFrom = latestMonday.addDays(-7 * (WeekPatternRule.weekendWeeks - 1));
  const weekendWhole = usableIntakeDays(
    intake.filter((d) => !d.date.isBefore(weekendFrom) && !d.date.isAfter(through) && d.kcal > 0),
    { plannedShare },
  );
  const pairedWeeks = Array.from({ length: WeekPatternRule.weekendWeeks }, (_, i) => weekendFrom.addDays(7 * i))
    .map((monday) => {
      const sunday = monday.addDays(6);
      const inWeek = weekendWhole.filter((d) => !d.date.isBefore(monday) && !d.date.isAfter(sunday));
      return { monday, weekend: inWeek.filter((d) => d.date.isWeekend), weekdays: inWeek.filter((d) => !d.date.isWeekend) };
    })
    .filter(
      (w) =>
        w.weekend.length > 0 &&
        w.weekdays.length >= WeekPatternRule.minimumWeekdaysPerWeek &&
        [...w.weekend, ...w.weekdays].every((d) => recordOn(d.date) !== undefined),
    );
  const higherWeeks = pairedWeeks.filter(
    (w) =>
      averageAsPlanned(w.weekend) - averageAsPlanned(w.weekdays) >=
      WeekPatternRule.weekendExcessOfTarget * targetOf([...w.weekend, ...w.weekdays]),
  ).length;
  const weeksCounted = pairedWeeks.length;
  if (
    (weeksCounted >= WeekPatternRule.allAgreeWeeks && higherWeeks === weeksCounted) ||
    (weeksCounted >= WeekPatternRule.mostAgreeWeeks && higherWeeks / weeksCounted >= WeekPatternRule.mostAgreeShare)
  ) {
    const weekend = pairedWeeks.flatMap((w) => w.weekend);
    const weekdays = pairedWeeks.flatMap((w) => w.weekdays);
    add(
      'weekendHigher',
      {
        weekdayDays: weekdays.length,
        weekendDays: weekend.length,
        weekdayAverageKcal: average(weekdays),
        weekendAverageKcal: average(weekend),
        targetKcal: targetOf([...weekend, ...weekdays]),
        weeks: weeksCounted,
        higherWeeks,
      },
      (pairedWeeks[0] as (typeof pairedWeeks)[0]).monday,
    );
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

  // One weekday was the unlogged day in three of the last four weeks and most of the days without a log (MM-614), or
  // the highest day in both of the last two weeks. Two random gaps a week share a weekday in two weeks about half the
  // time, and land three of four weeks on one weekday about a fifth of the time; only a weekday that is most of the
  // gaps is a habit. A day before the first log is not a gap.
  if (days === 14) {
    const weeksFrom = through.addDays(1 - 7 * WeekPatternRule.unloggedWeeks);
    const firstLogged = intake.reduce<CalendarDate | undefined>(
      (f, d) => (d.kcal > 0 && (f === undefined || d.date.isBefore(f)) ? d.date : f),
      undefined,
    );
    const weeks = Array.from({ length: WeekPatternRule.unloggedWeeks }, (_, index) => {
      const first = weeksFrom.addDays(7 * index);
      const last = first.addDays(6);
      const within = (d: CalendarDate) => !d.isBefore(first) && !d.isAfter(last);
      const loggedDates = new Set(intake.filter((d) => within(d.date) && d.kcal > 0).map((d) => d.date));
      const wholeDays = whole.filter((d) => within(d.date));
      const unlogged = upToSeven
        .map((i) => first.addDays(i))
        .filter((d) => !loggedDates.has(d) && firstLogged !== undefined && !d.isBefore(firstLogged));
      // The highest day against its plan stands out: alone at the top, and well above the rest.
      const top = wholeDays.reduce<IntakeDay | undefined>(
        (h, d) => (h === undefined || asPlanned(d) > asPlanned(h) ? d : h),
        undefined,
      );
      const rest = wholeDays.filter((d) => d !== top);
      const target = top === undefined ? undefined : recordOn(top.date)?.targets.kcal;
      const standsOut =
        top !== undefined &&
        target !== undefined &&
        rest.length > 0 &&
        asPlanned(top) - averageAsPlanned(rest) >= WeekPatternRule.highestDayExcessOfTarget * target &&
        rest.every((d) => asPlanned(d) < asPlanned(top));
      return { loggedDays: loggedDates.size, wholeDays: wholeDays.length, unlogged, highest: standsOut ? top : undefined };
    });
    // The highest day keeps its two-week basis: the last two of the four weeks, the period the whole days come from.
    const [one, two] = weeks.slice(-2) as [(typeof weeks)[0], (typeof weeks)[0]];
    const enough = (count: number) => count >= WeekPatternRule.minimumDaysPerWeek;
    const gaps = weeks.reduce((s, w) => s + w.unlogged.length, 0);
    const unloggedWeeksOf = (weekday: number) =>
      weeks.filter((w) => enough(w.loggedDays) && w.unlogged.some((d) => d.weekday === weekday)).length;
    const unloggedDay = upToSeven.find((weekday) => {
      const count = unloggedWeeksOf(weekday);
      return count >= WeekPatternRule.unloggedMinimumWeeks && count * 2 > gaps;
    });
    if (unloggedDay !== undefined) {
      add(
        'consistentDay',
        { weekday: unloggedDay, unlogged: 1, weeks: WeekPatternRule.unloggedWeeks, unloggedWeeks: unloggedWeeksOf(unloggedDay) },
        weeksFrom,
      );
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
