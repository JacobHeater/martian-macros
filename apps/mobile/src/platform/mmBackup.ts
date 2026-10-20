import { registerPlugin } from '@capacitor/core';
import type { MmBackupApi } from './MmBackupApi';

/** The native `MmBackup` plugin (MM-63), registered by the shells. */
export const mmBackup = registerPlugin<MmBackupApi>('MmBackup');
