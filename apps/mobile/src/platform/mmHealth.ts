import { registerPlugin } from '@capacitor/core';
import type { MmHealthApi } from './MmHealthApi';
import type { MmHealthProfileApi } from './MmHealthProfileApi';
import type { MmHealthWorkoutsApi } from './MmHealthWorkoutsApi';
import type { MmHealthWritingApi } from './MmHealthWritingApi';

/**
 * The native health plugin, which answers only inside the native shell: reading, and writing what is turned on
 * (MM-70, MM-489); on iOS, the profile for onboarding too (MM-69).
 */
export const mmHealth = registerPlugin<MmHealthApi & MmHealthWritingApi & MmHealthWorkoutsApi & MmHealthProfileApi>('MmHealth');
