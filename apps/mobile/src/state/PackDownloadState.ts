import type { PackDownloadProblem } from '../foodCatalog/download/PackDownloadProblem';
import type { PackDownloadProgress } from '../foodCatalog/download/PackDownloadProgress';
import type { PackListing } from '../foodCatalog/download/PackListing';
import type { PackDownloadStatus } from './PackDownloadStatus';

/** What the app knows about the current food-pack download. */
export interface PackDownloadState {
  readonly status: PackDownloadStatus;
  readonly listing?: PackListing | undefined;
  readonly progress?: PackDownloadProgress | undefined;
  readonly problem?: PackDownloadProblem | undefined;
  /** Bytes kept on the phone from a cancelled or interrupted download. */
  readonly keptBytes: number;
}
