import type { MaintenanceAnchor } from './MaintenanceAnchor';
import type { MaintenanceDriftStatus } from './MaintenanceDriftStatus';

/** Where the trend weight stands against the maintenance anchor (MM-130). */
export interface MaintenanceDrift {
  readonly status: MaintenanceDriftStatus;
  readonly anchor: MaintenanceAnchor;
  /** The latest trend weight, and how far it is from the anchor (positive is above). */
  readonly trendWeightKg: number;
  readonly deviationKg: number;
  /** Consecutive days through yesterday the trend has been outside the band on one side. */
  readonly daysOutside: number;
}
