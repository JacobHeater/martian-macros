import type { BackupProblemKind } from './BackupProblemKind';

/** A backup file that could not be opened, and why (MM-63). */
export class BackupProblem extends Error {
  readonly kind: BackupProblemKind;

  constructor(kind: BackupProblemKind) {
    super(
      {
        notABackup: 'This file is not a Martian Macros backup.',
        newerFormat: 'This backup was made by a newer version of the app. Update the app, then try again.',
        wrongPassphrase: 'That passphrase does not open this backup.',
        tampered: 'This backup has been changed since it was made, so it cannot be opened.',
      }[kind],
    );
    this.kind = kind;
  }
}
