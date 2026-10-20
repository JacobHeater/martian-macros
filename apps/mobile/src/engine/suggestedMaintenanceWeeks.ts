import { MaintenanceRule } from './MaintenanceRule';

/**
 * How long to stay at maintenance after a cut before another (MM-130):
 * about a week per four weeks of deficit just completed, never under two.
 * A suggestion; the unbroken-deficit rule (MM-31) is the hard part.
 */
export function suggestedMaintenanceWeeks(deficitWeeks: number): number {
  return Math.max(
    MaintenanceRule.minimumMaintenanceWeeks,
    Math.round(deficitWeeks / MaintenanceRule.deficitWeeksPerMaintenanceWeek),
  );
}
