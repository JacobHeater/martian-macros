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
 *
 * A shaped week's planned lower days (MM-124) are judged whole against their
 * plan (`plannedShare`), as the expenditure estimate judges them, so they are
 * not left out as partial. The average and the low days stay in real
 * calories: the floor is about what was eaten, not about the plan.
 *
 * With `weightLossMedication`, `UnderEatingRule.minimumDaysOnWeightLossMedication`
 * whole days are enough (MM-113).
 */
export function findUnderEating({
  through,
  intake,
  floorKcal,
  weightLossMedication = false,
  plannedShare,
}: {
  through: CalendarDate;
  intake: readonly IntakeDay[];
  floorKcal: number;
  weightLossMedication?: boolean;
  /** The share of the flat figure planned for each day (MM-124); every day flat without it. */
  plannedShare?: ((date: CalendarDate) => number) | undefined;
}): UnderEatingFinding | undefined {
  const from = through.addDays(1 - UnderEatingRule.windowDays);
  const window = intake.filter((d) => !d.date.isBefore(from) && !d.date.isAfter(through));
  const whole = usableIntakeDays(window, { plannedShare });
  const minimumDays = weightLossMedication
    ? UnderEatingRule.minimumDaysOnWeightLossMedication
    : UnderEatingRule.minimumDays;
  if (whole.length < minimumDays) return undefined;
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
