import { registerPlugin } from '@capacitor/core';
import type { MmTransferApi } from './MmTransferApi';

/** The native `MmTransfer` plugin (MM-697), registered by the shells. */
export const mmTransfer = registerPlugin<MmTransferApi>('MmTransfer');
