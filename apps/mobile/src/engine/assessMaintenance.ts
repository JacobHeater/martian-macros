import type { CalendarDate } from '../domain/CalendarDate';
import type { UserSetup } from '../domain/UserSetup';
import { assessMaintenanceDrift } from './assessMaintenanceDrift';
import { consecutiveDeficitWeeks } from './consecutiveDeficitWeeks';
import { maintenanceAnchorOf } from './maintenanceAnchorOf';
import { maintenanceStartOn } from './maintenanceStartOn';
import type { MaintenanceStatus } from './MaintenanceStatus';
import type { TargetsRecord } from './TargetsRecord';
import type { WeightTrendPoint } from './WeightTrendPoint';

/**
 * Where a person at maintenance stands (MM-130), or undefined when the
 * targets in force are not maintenance. Nothing here changes a target.
 */
export function assessMaintenance({
  setup,
  history,
  trend,
  today,
}: {
  setup: UserSetup;
  history: readonly TargetsRecord[];
  trend: readonly WeightTrendPoint[];
  today: CalendarDate;
}): MaintenanceStatus | undefined {
  const startedOn = maintenanceStartOn(history, today);
  if (startedOn === undefined) return undefined;
  // The deficit that ended when maintenance began, if one did.
  const before = history.filter((r) => r.effectiveFrom.isBefore(startedOn));
  const lastBefore = before[before.length - 1];
  const fromDeficitWeeks =
    lastBefore !== undefined && lastBefore.targets.weeklyRateFraction < 0 ? consecutiveDeficitWeeks(before, startedOn) : 0;
  const anchor = maintenanceAnchorOf({ history, trend, today, acceptedOn: setup.maintenanceAnchorOn });
  const drift = anchor === undefined ? undefined : assessMaintenanceDrift({ anchor, trend, today });
  const from = setup.maintenanceCorrectionFrom;
  return {
    startedOn,
    fromDeficitWeeks,
    anchor,
    drift,
    correcting: from !== undefined && !today.isBefore(from) && !from.isBefore(startedOn),
  };
}
