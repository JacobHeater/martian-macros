import type { BodyWeightRecord } from './BodyWeightRecord';

/**
 * Writes the body weight the user types in the app to the phone's health
 * platform (MM-513), and keeps it in step: a weigh-in changed is written
 * again under its id, one removed is removed. Only the app's own records
 * are ever changed or removed, and what the app wrote is never read back as
 * a reading. Weight is written only while `HealthWriting` has it on;
 * otherwise every call is false and nothing on the platform changes.
 */
export interface HealthWeightWriter {
  /** Writes a weigh-in, replacing what was written before under its id. */
  writeWeight(record: BodyWeightRecord): Promise<boolean>;

  /** Removes what was written for the weigh-in under `id`. */
  removeWeight(id: string): Promise<boolean>;
}
