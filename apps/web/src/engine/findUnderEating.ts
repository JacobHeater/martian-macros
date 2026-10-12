import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { UnderEatingFinding } from './UnderEatingFinding';
import { UnderEatingRule } from './UnderEatingRule';
import { usableIntakeDays } from './usableIntakeDays';

/**
 * A finding when, over the `UnderEatingRule.windowDays` days to `through`,
 * at least `UnderEatingRule.minimumDays` whole days average more than 10%
 * below `floorKcal`; otherwise undefined (MM-114).
 *
 * Whole days are those marked complete or passing the expenditure
 * estimate's usable-day rule. Days marked partial and empty days never
 * count, so someone logging only part of what they eat is not told they are
 * under-eating once they say so. It never changes a target.
 */
export function findUnderEating({
  through,
  intake,
  floorKcal,
}: {
  through: CalendarDate;
  intake: readonly IntakeDay[];
  floorKcal: number;
}): UnderEatingFinding | undefined {
  const from = through.addDays(1 - UnderEatingRule.windowDays);
  const window = intake.filter((d) => !d.date.isBefore(from) && !d.date.isAfter(through));
  const whole = usableIntakeDays(window);
  if (whole.length < UnderEatingRule.minimumDays) return undefined;
  const average = whole.reduce((s, d) => s + d.kcal, 0) / whole.length;
  if (average >= floorKcal * (1 - UnderEatingRule.marginBelowFloor)) {
    return undefined;
  }
  return {
    averageKcal: average,
    floorKcal,
    days: whole.length,
    lowDays: whole.filter((d) => d.kcal < floorKcal).map((d) => d.date),
  };
}
