import type { CalendarDate } from '../domain/CalendarDate';

/** The weight maintenance is held against (MM-130), and the day it was read from the trend. */
export interface MaintenanceAnchor {
  readonly weightKg: number;
  readonly on: CalendarDate;
  /** The trend weight within this of the anchor is maintaining. */
  readonly halfWidthKg: number;
}
