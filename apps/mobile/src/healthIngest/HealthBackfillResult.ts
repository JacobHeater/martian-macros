import type { HealthBackfillStatus } from './HealthBackfillStatus';

/** What one backfill of a type did (MM-73). */
export interface HealthBackfillResult {
  readonly status: HealthBackfillStatus;

  /** Readings read and kept, each kept once by its platform id. */
  readonly upserted: number;

  /** Of those, the ones that were not kept before: what is new to the app. */
  readonly added: number;
}
