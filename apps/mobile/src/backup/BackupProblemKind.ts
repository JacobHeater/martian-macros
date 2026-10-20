/** Why a backup file could not be opened (MM-63). */
export type BackupProblemKind = 'notABackup' | 'newerFormat' | 'wrongPassphrase' | 'tampered';
