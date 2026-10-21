import type { HealthImportStatus } from './HealthImportStatus';

/** What one import did (MM-67). */
export interface HealthImportResult {
  readonly status: HealthImportStatus;

  /** Readings added or brought up to date. */
  readonly upserted: number;

  /**
   * Readings removed: those the platform reported as deleted, or after a
   * re-read those it no longer has within what it shows (MM-498).
   */
  readonly deleted: number;
}
