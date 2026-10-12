import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
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
 */
export function summarizeAdherence({
  through,
  intake,
  weights,
  history,
  floorKcal,
  days = 7,
}: {
  through: CalendarDate;
  intake: readonly IntakeDay[];
  weights: readonly WeightObservation[];
  history: readonly TargetsRecord[];
  floorKcal?: number | undefined;
  days?: number;
}): AdherenceSummary {
  const from = through.addDays(1 - days);
  const inWeek = (d: CalendarDate) => !d.isBefore(from) && !d.isAfter(through);

  const contextFrom = through.addDays(-27);
  const context = intake.filter((d) => !d.date.isBefore(contextFrom) && !d.date.isAfter(through));
  const complete = usableIntakeDays(context).filter((d) => inWeek(d.date));
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
  const averageTarget = targetDays === 0 ? undefined : targetSum / targetDays;

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
