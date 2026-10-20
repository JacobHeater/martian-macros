import type { BackupKdf } from './BackupKdf';

/**
 * The plain header of a backup file (MM-63): what is needed to open it and
 * to say what it is, and nothing personal. The format version is the
 * file's own; the schema version is the database's inside.
 */
export interface BackupHeader {
  readonly format: 1;
  readonly app: 'martian-macros';
  readonly schemaVersion: number;
  /** The day the backup was made, as the phone's calendar had it. */
  readonly createdOn: string;
  readonly kdf: BackupKdf;
}
