import { registerPlugin } from '@capacitor/core';
import type { MmHealthApi } from './MmHealthApi';

/** The native Health Connect plugin, which answers only inside the native shell. */
export const mmHealth = registerPlugin<MmHealthApi>('MmHealth');
