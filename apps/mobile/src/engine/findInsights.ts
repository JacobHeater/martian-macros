import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import { Meal } from '../domain/Meal';
import type { WeightObservation } from '../domain/WeightObservation';
import { Insight } from './Insight';
import { InsightPriority } from './InsightPriority';
import { InsightRationing } from './InsightRationing';
import { InsightRule } from './InsightRule';
import { ProteinSpreadRule } from './ProteinSpreadRule';
import type { StallAssessment } from './StallAssessment';
import type { TargetsRecord } from './TargetsRecord';
import { usableIntakeDays } from './usableIntakeDays';

const mainMeals: readonly Meal[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Every insight the catalog's rules produce from the data up to `through`,
 * highest priority first (MM-141). Rationing is applied afterwards by
 * `selectInsight`.
 *
 * Each rule is a pattern over `InsightRationing.patternDays` days resting on
 * at least `InsightRationing.minimumBasisDays` days of data, so nothing here
 * can be about a single day or a single weigh-in. For a user with an
 * eating-disorder history (`limitToProteinAndLogging`) rules about weight
 * are left out entirely.
 */
export function findInsights({
  through,
  intake,
  weights,
  history,
  stall,
  mealProtein = new Map(),
  limitToProteinAndLogging = false,
}: {
  through: CalendarDate;
  intake: readonly IntakeDay[];
  weights: readonly WeightObservation[];
  history: readonly TargetsRecord[];
  stall?: StallAssessment | undefined;
  mealProtein?: ReadonlyMap<CalendarDate, ReadonlyMap<Meal, number>>;
  limitToProteinAndLogging?: boolean;
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
  const minimumOn = (day: CalendarDate): number | undefined => {
    let value: number | undefined;
    for (const r of sorted) {
      if (r.effectiveFrom.isAfter(day)) break;
      value = r.targets.proteinMinimumG;
    }
    return value;
  };
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

  const allowed = found.filter((i) => !(limitToProteinAndLogging && InsightRule.aboutWeight(i.rule)));
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
