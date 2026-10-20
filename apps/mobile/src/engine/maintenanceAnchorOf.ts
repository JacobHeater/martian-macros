import type { CalendarDate } from '../domain/CalendarDate';
import type { MaintenanceAnchor } from './MaintenanceAnchor';
import { MaintenanceRule } from './MaintenanceRule';
import { maintenanceStartOn } from './maintenanceStartOn';
import type { TargetsRecord } from './TargetsRecord';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * The maintenance anchor (MM-130): the trend weight 14 days after
 * maintenance began, after the water of a cut has come back, or on the day
 * the user accepted a new weight (`acceptedOn`). Undefined before that day,
 * when there is no trend for it, or outside maintenance.
 */
export function maintenanceAnchorOf({
  history,
  trend,
  today,
  acceptedOn,
}: {
  history: readonly TargetsRecord[];
  trend: readonly WeightTrendPoint[];
  today: CalendarDate;
  acceptedOn?: CalendarDate | undefined;
}): MaintenanceAnchor | undefined {
  const start = maintenanceStartOn(history, today);
  if (start === undefined) return undefined;
  const sinceStart = acceptedOn !== undefined && !acceptedOn.isBefore(start) ? acceptedOn : undefined;
  const on = sinceStart ?? start.addDays(MaintenanceRule.anchorAfterDays);
  if (on.isAfter(today)) return undefined;
  // The trend point on that day, or the latest before it.
  let point: WeightTrendPoint | undefined;
  for (const p of trend) {
    if (p.date.isAfter(on)) continue;
    if (point === undefined || p.date.isAfter(point.date)) point = p;
  }
  if (point === undefined) return undefined;
  return { weightKg: point.levelKg, on, halfWidthKg: point.levelKg * MaintenanceRule.bandFraction };
}
