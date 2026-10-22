import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Workout } from '../domain/training/Workout';
import type { WeightObservation } from '../domain/WeightObservation';
import { AdherenceSummary } from './AdherenceSummary';
import { intakeStandingOf } from './intakeStandingOf';
import type { TargetsRecord } from './TargetsRecord';
import { usableIntakeDays } from './usableIntakeDays';

/**
 * The adherence summary for the `days` days ending on `through` (MM-149).
 *
 * Which days count as whole is decided by the same rule the expenditure
 * estimate uses, judged over the four weeks ending on `through` so one thin
 * week cannot set its own standard. `floorKcal` is the lowest target the app
 * would suggest; an average below it is never "on target".
 *
 * A shaped week (MM-124) is read against its plan: `plannedShare`
 * (`plannedDayShare(shapes)`) decides which days are whole as the
 * expenditure estimate does, and the target the average is held to is the
 * plan for the whole days it rests on (the week's target times their mean
 * share), so a week whose whole days lean on its planned lower days is not
 * read as under, nor one that leans on its higher days as over. Without it
 * every day is planned flat.
 */
export function summarizeAdherence({
  through,
  intake,
  weights,
  history,
  floorKcal,
  workouts,
  days = 7,
  plannedShare,
}: {
  through: CalendarDate;
  intake: readonly IntakeDay[];
  weights: readonly WeightObservation[];
  history: readonly TargetsRecord[];
  floorKcal?: number | undefined;
  /** The training log's workouts; undefined when the log is not read, so the fact is left out rather than said as zero. */
  workouts?: readonly Workout[] | undefined;
  days?: number;
  /** The share of the flat figure planned for each day (MM-124); every day flat without it. */
  plannedShare?: ((date: CalendarDate) => number) | undefined;
}): AdherenceSummary {
  const from = through.addDays(1 - days);
  const inWeek = (d: CalendarDate) => !d.isBefore(from) && !d.isAfter(through);

  const contextFrom = through.addDays(-27);
  const context = intake.filter((d) => !d.date.isBefore(contextFrom) && !d.date.isAfter(through));
  const complete = usableIntakeDays(context, { plannedShare }).filter((d) => inWeek(d.date));
  const logged = intake.filter((d) => inWeek(d.date) && d.kcal > 0).length;

  const sorted = [...history].sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  const inForceOn = (day: CalendarDate): TargetsRecord | undefined => {
    let found: TargetsRecord | undefined;
    for (const r of sorted) {
      if (r.effectiveFrom.isAfter(day)) break;
      found = r;
    }
    return found;
  };

  let targetSum = 0;
  let targetDays = 0;
  for (let i = 0; i < days; i++) {
    const record = inForceOn(from.addDays(i));
    if (record !== undefined) {
      targetSum += record.targets.kcal;
      targetDays++;
    }
  }
  // The plan for the whole days the average rests on: 1 on a flat week, and over a whole shaped week too.
  const meanShare =
    plannedShare === undefined || complete.length === 0
      ? 1
      : complete.reduce((s, d) => s + plannedShare(d.date), 0) / complete.length;
  const averageTarget = targetDays === 0 ? undefined : (targetSum / targetDays) * meanShare;

  let averageIntake: number | undefined;
  let mostlyEstimated = false;
  let proteinDays: number | undefined;
  if (complete.length > 0) {
    const kcal = complete.reduce((s, d) => s + d.kcal, 0);
    averageIntake = kcal / complete.length;
    const estimated = complete.reduce((s, d) => s + d.kcal * d.estimatedShare, 0);
    mostlyEstimated = kcal > 0 && estimated / kcal > 0.5;
  }
  for (const d of complete) {
    const minimum = inForceOn(d.date)?.targets.proteinMinimumG;
    if (minimum === undefined) continue;
    proteinDays = (proteinDays ?? 0) + (d.proteinG >= minimum ? 1 : 0);
  }

  return new AdherenceSummary({
    from,
    to: through,
    daysLogged: logged,
    completeDays: complete.length,
    weighIns: weights.filter((w) => inWeek(w.date)).length,
    workouts: workouts === undefined ? undefined : workouts.filter((w) => !w.inProgress && inWeek(w.date)).length,
    averageIntakeKcal: averageIntake,
    averageTargetKcal: averageTarget,
    standing:
      averageIntake === undefined || averageTarget === undefined
        ? undefined
        : intakeStandingOf({ kcal: averageIntake, targetKcal: averageTarget, floorKcal }),
    proteinDays,
    mostlyEstimated,
  });
}
