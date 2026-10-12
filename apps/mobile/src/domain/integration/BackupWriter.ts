import type { Outcome } from './Outcome';

/** Writes backup blobs to wherever they are stored. */
export interface BackupWriter {
  /** Stores `bytes` under `name`, replacing any blob with that name. */
  put(name: string, bytes: Uint8Array): Promise<Outcome<void>>;

  /** Removes the blob named `name`; removing a missing one succeeds. */
  delete(name: string): Promise<Outcome<void>>;
}
