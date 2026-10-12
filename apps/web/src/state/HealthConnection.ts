import type { HealthDataType } from '../healthIngest/HealthDataType';
import type { HealthSample } from '../healthIngest/HealthSample';

/**
 * How the health platform stands for the app right now (MM-68): what it
 * has, what the user allows, and what has been imported of each kind.
 */
export interface HealthConnection {
  /** Empty when the platform is not on this device. */
  readonly available: ReadonlySet<HealthDataType>;
  readonly permitted: ReadonlySet<HealthDataType>;
  /** The stored readings of each permitted kind. */
  readonly imported: ReadonlyMap<HealthDataType, readonly HealthSample[]>;
}
