import { clamp } from '../../lang/clamp';
import type { PackDownloadPhase } from './PackDownloadPhase';

/** A snapshot of a download, for a progress bar. */
export class PackDownloadProgress {
  readonly phase: PackDownloadPhase;
  readonly receivedBytes: number;
  readonly totalBytes: number;

  constructor(init: { phase: PackDownloadPhase; receivedBytes: number; totalBytes: number }) {
    this.phase = init.phase;
    this.receivedBytes = init.receivedBytes;
    this.totalBytes = init.totalBytes;
  }

  /** 0 to 1 while downloading. */
  get fraction(): number {
    return this.totalBytes <= 0 ? 0 : clamp(this.receivedBytes / this.totalBytes, 0, 1);
  }
}
