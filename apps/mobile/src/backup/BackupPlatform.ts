import type { SaveOutcome } from './SaveOutcome';

/**
 * What the phone does for a backup (MM-63, MM-64): a consistent copy of the
 * live database, and the system's own ways to put a file somewhere and to
 * pick one. No provider account: the share sheet and the file picker are
 * always there.
 */
export interface BackupPlatform {
  /** The live database as the bytes of a database file, consistent even mid-write (`VACUUM INTO`). */
  snapshot(): Promise<Uint8Array>;
  /** Hands `file` to the system to save or send, under `name`. */
  save(file: Uint8Array, name: string): Promise<SaveOutcome>;
  /** Lets the person pick a file; undefined when they do not. */
  pick(): Promise<Uint8Array | undefined>;
}
