import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import { SodiumDay } from '../domain/food/micros/SodiumDay';
import type { IntakeDay } from '../domain/IntakeDay';
import type { MenstruationDay } from '../domain/MenstruationDay';
import type { Workout } from '../domain/training/Workout';
import type { WeightEvent } from '../domain/WeightEvent';
import type { WeightObservation } from '../domain/WeightObservation';
import { CalorieBand } from './CalorieBand';
import { cycleWindows } from './cycleWindows';
import { fatMassKcalPerKg } from './partitionConstants';
import { settlingWindows } from './settlingWindows';
import type { TargetsRecord } from './TargetsRecord';
import type { WeightJumpCause } from './WeightJumpCause';
import { WeightJumpCauseKind } from './WeightJumpCauseKind';
import { WeightJumpExplanation } from './WeightJumpExplanation';
import { WeightJumpRule } from './WeightJumpRule';
import type { WeightTrendPoint } from './WeightTrendPoint';

/** The mean of `values`, or undefined with none. */
function mean(values: readonly number[]): number | undefined {
  return values.length === 0 ? undefined : values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Why a weigh-in is probably far from the trend (MM-142), or undefined when
 * it is inside the day-to-day noise and needs no explanation, or when the
 * trend has no point for its day.
 *
 * A reading counts as far when it is `WeightJumpRule.noiseFraction` of the
 * trend weight above or below it. The last two days of the person's own log
 * are then searched for likely causes, listed in `WeightJumpCauseKind`'s
 * order and capped at three: a weight event they noted; a day's
 * carbohydrate or sodium well above the usual (below it for a low reading);
 * yesterday's calories outside the target band; alcohol; a workout; a cycle
 * window; the first days after a change of phase. Sodium is judged only on
 * days where enough of the food states it, so a missing value is never
 * read as zero (MM-126). With nothing found the causes are empty, which the
 * words say honestly.
 *
 * `entries` are the food entries of the days searched and the days that
 * make up the usual; entries of other days are ignored.
 */
export function explainWeightJump({
  reading,
  trend,
  intake = [],
  entries = [],
  workouts = [],
  flowDays = [],
  weightEvents = [],
  history = [],
}: {
  reading: WeightObservation;
  trend: readonly WeightTrendPoint[];
  intake?: readonly IntakeDay[];
  entries?: readonly FoodEntry[];
  workouts?: readonly Workout[];
  flowDays?: readonly MenstruationDay[];
  weightEvents?: readonly WeightEvent[];
  history?: readonly TargetsRecord[];
}): WeightJumpExplanation | undefined {
  const day = reading.date;
  const point = trend.find((p) => p.date === day);
  if (point === undefined) return undefined;
  const deviation = reading.weightKg - point.levelKg;
  const threshold = WeightJumpRule.noiseFraction * point.levelKg;
  if (Math.abs(deviation) < threshold) return undefined;
  const above = deviation > 0;

  const found = new Map<WeightJumpCause['kind'], WeightJumpCause>();
  const add = (cause: WeightJumpCause) => {
    if (!found.has(cause.kind)) found.set(cause.kind, cause);
  };
  const searched = Array.from({ length: WeightJumpRule.lookBackDays }, (_, i) => i + 1);
  const dayAgo = (daysAgo: number) => day.addDays(-daysAgo);
  const logged = (d: CalendarDate) => intake.find((i) => i.date === d && i.kcal > 0);
  const entriesOn = (d: CalendarDate) => entries.filter((e) => e.date === d);
  /** The days that make up the usual for the day `daysAgo` back: the `usualDays` before it. */
  const usualDaysBefore = (daysAgo: number) =>
    Array.from({ length: WeightJumpRule.usualDays }, (_, i) => dayAgo(daysAgo + 1 + i));

  // What the person noted themselves comes first: it is their own account.
  const event = weightEvents
    .filter((e) => !e.date.isAfter(day) && e.date.daysUntil(day) < WeightJumpRule.eventWithinDays)
    .sort((a, b) => b.date.compareTo(a.date))[0];
  if (event !== undefined) {
    add({ kind: 'weightEvent', figures: { daysAgo: event.date.daysUntil(day) }, eventType: event.type });
  }

  // A day's carbohydrate or sodium well off the usual, the larger excess of the two days searched.
  const offUsual = (value: (d: CalendarDate) => number | undefined) => {
    let best: { daysAgo: number; amount: number; usual: number; excess: number } | undefined;
    for (const daysAgo of searched) {
      const amount = value(dayAgo(daysAgo));
      if (amount === undefined) continue;
      const usualValues = usualDaysBefore(daysAgo).map(value).filter((v): v is number => v !== undefined);
      if (usualValues.length < WeightJumpRule.usualMinimumDays) continue;
      const usual = mean(usualValues);
      if (usual === undefined || usual <= 0) continue;
      const excess = (amount - usual) / usual;
      const holds = above ? excess >= WeightJumpRule.aboveUsualFraction : excess <= -WeightJumpRule.aboveUsualFraction;
      if (holds && (best === undefined || Math.abs(excess) > Math.abs(best.excess))) best = { daysAgo, amount, usual, excess };
    }
    return best;
  };
  const carbohydrate = offUsual((d) => logged(d)?.carbsG);
  if (carbohydrate !== undefined) {
    const { daysAgo, amount, usual } = carbohydrate;
    add({ kind: 'carbohydrate', figures: { daysAgo, amount, usual } });
  }
  // Sodium only where enough of the day states it (the fiber rule's coverage, MM-126).
  const sodium = offUsual((d) => {
    const on = entriesOn(d);
    if (on.length === 0) return undefined;
    const sodiumDay = SodiumDay.of(on);
    return sodiumDay.coveredShare >= SodiumDay.minimumCoverage ? sodiumDay.knownMg : undefined;
  });
  if (sodium !== undefined) {
    const { daysAgo, amount, usual } = sodium;
    add({ kind: 'sodium', figures: { daysAgo, amount, usual } });
  }

  // Yesterday's calories outside the target band in force that day.
  const yesterday = logged(dayAgo(1));
  const inForce = [...history].filter((r) => !r.effectiveFrom.isAfter(dayAgo(1))).sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  const record = inForce[inForce.length - 1];
  if (yesterday !== undefined && record !== undefined) {
    const band = new CalorieBand(record.targets.kcal);
    // A partial day under target says nothing: the food may simply be missing.
    const holds = above ? yesterday.kcal > band.highKcal : yesterday.kcal < band.lowKcal && yesterday.completeness === 'complete';
    if (holds) {
      const overExpenditure = yesterday.kcal - record.tdeeKcal;
      const fatAtMost = Math.max(0, above ? overExpenditure : -overExpenditure) / fatMassKcalPerKg;
      add({
        kind: 'calories',
        figures: {
          kcal: yesterday.kcal,
          targetKcal: record.targets.kcal,
          overTargetKcal: yesterday.kcal - record.targets.kcal,
          overExpenditureKcal: overExpenditure,
          fatAtMostKg: fatAtMost,
        },
      });
    }
  }

  // Alcohol on either day, the nearer first.
  for (const daysAgo of searched) {
    const alcoholG = entriesOn(dayAgo(daysAgo)).reduce((sum, e) => sum + (e.alcoholG ?? 0), 0);
    if (alcoholG > 0) {
      add({ kind: 'alcohol', figures: { alcoholG, daysAgo } });
      break;
    }
  }

  // A finished workout on either day, the nearer first.
  const workout = workouts
    .filter((w) => !w.inProgress && searched.includes(w.date.daysUntil(day)))
    .sort((a, b) => b.date.compareTo(a.date))[0];
  if (workout !== undefined) add({ kind: 'workout', figures: { daysAgo: workout.date.daysUntil(day) } });

  if (cycleWindows(flowDays).some(({ from, to }) => !day.isBefore(from) && !day.isAfter(to))) {
    add({ kind: 'cycleWindow', figures: {} });
  }

  const settling = settlingWindows(history).find((window) => window.contains(day));
  if (settling !== undefined) add({ kind: 'phaseChange', figures: { daysSince: settling.start.daysUntil(day) } });

  const causes = WeightJumpCauseKind.values
    .map((kind) => found.get(kind))
    .filter((cause): cause is WeightJumpCause => cause !== undefined)
    .slice(0, WeightJumpRule.maxCauses);
  return new WeightJumpExplanation({
    date: day,
    readingKg: reading.weightKg,
    trendKg: point.levelKg,
    thresholdKg: threshold,
    causes,
    fatKcal: Math.abs(deviation) * fatMassKcalPerKg,
  });
}
