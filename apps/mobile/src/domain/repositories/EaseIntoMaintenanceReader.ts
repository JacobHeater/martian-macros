import type { Watched } from '../../lang/Watched';

/** Whether leaving a deficit goes to maintenance in two steps over 14 days (MM-130); off by default. */
export interface EaseIntoMaintenanceReader {
  watchEaseIntoMaintenance(): Watched<boolean>;
}
