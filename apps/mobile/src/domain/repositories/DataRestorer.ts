import type { BackupContents } from '../backup/BackupContents';

/**
 * Puts a backup's database in place of this phone's (MM-63): everything the
 * eraser knows is replaced in one write, so every store re-reads. The
 * backup arrives as the bytes of a database file; the implementation opens
 * a copy and brings it to the current schema first.
 */
export interface DataRestorer {
  /** What the backup holds, so the person can be told what a restore replaces. */
  describe(snapshot: Uint8Array): Promise<BackupContents>;
  /** What this phone holds now. */
  describeHere(): Promise<BackupContents>;
  /** Replaces this phone's data; `progress`, when given, hears the rows written of all rows after each batch (MM-702). */
  restoreFrom(snapshot: Uint8Array, progress?: (done: number, total: number) => void): Promise<void>;
}
