import type { HealthImportStatus } from './HealthImportStatus';

/** What one import did (MM-67). */
export interface HealthImportResult {
  readonly status: HealthImportStatus;

  /** Readings added or brought up to date. */
  readonly upserted: number;

  /** Readings the platform reported as deleted. */
  readonly deleted: number;
}
