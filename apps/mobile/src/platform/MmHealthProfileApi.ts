import type { MmHealthProfile } from './MmHealthProfile';

/**
 * The health plugin's profile read (MM-69), on iOS only: it asks to read
 * biological sex, date of birth and height, then answers what Apple Health
 * holds. Rejected when Apple Health is not on the device or fails.
 */
export interface MmHealthProfileApi {
  profile(): Promise<MmHealthProfile>;
}
