import type { BackupReader } from './BackupReader';
import type { BackupWriter } from './BackupWriter';

/**
 * Somewhere to keep encrypted backup blobs: a cloud drive, a folder, a share
 * target. Knows nothing of accounts, tokens or encryption.
 */
export interface BackupStorage extends BackupReader, BackupWriter {}
