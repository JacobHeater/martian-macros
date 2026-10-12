import type { HealthDataType } from './HealthDataType';
import type { HealthSample } from './HealthSample';

/**
 * Where imported readings are kept (MM-67): apart from what the user
 * typed, so importing never overwrites a typed correction, and by
 * platform id, so importing twice never duplicates.
 */
export interface HealthSampleStore {
  /** The stored readings of `type`, oldest first. */
  samples(type: HealthDataType): Promise<HealthSample[]>;

  /** Adds each reading, or replaces the stored one with its platform id. */
  upsert(samples: readonly HealthSample[]): Promise<void>;

  /**
   * Removes the readings of `type` with these platform ids. Ids that are
   * not stored are ignored.
   */
  delete(type: HealthDataType, platformIds: readonly string[]): Promise<void>;

  /** Makes the stored readings of `type` exactly `samples`. */
  replace(type: HealthDataType, samples: readonly HealthSample[]): Promise<void>;

  /** The token saved for `type`, or undefined before the first import. */
  token(type: HealthDataType): Promise<string | undefined>;

  saveToken(type: HealthDataType, token: string): Promise<void>;
}
