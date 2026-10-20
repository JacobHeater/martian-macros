import type { CalendarDate } from '../domain/CalendarDate';
import type { MaintenanceAnchor } from './MaintenanceAnchor';
import type { MaintenanceDrift } from './MaintenanceDrift';

/** Where a person at maintenance stands (MM-130): what they came from, the anchor once set, and any drift. */
export interface MaintenanceStatus {
  /** The day this run of maintenance began. */
  readonly startedOn: CalendarDate;
  /** Whole weeks of the deficit that ended when it began; 0 when it did not follow a cut. */
  readonly fromDeficitWeeks: number;
  /** The anchor, once the water has come back; undefined before. */
  readonly anchor: MaintenanceAnchor | undefined;
  readonly drift: MaintenanceDrift | undefined;
  /** Whether a correction back toward the anchor is running. */
  readonly correcting: boolean;
}
