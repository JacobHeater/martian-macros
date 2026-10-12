import { registerPlugin } from '@capacitor/core';
import type { MmRemindersApi } from './MmRemindersApi';

/** The native reminders plugin, which answers only inside the native shell. */
export const mmReminders = registerPlugin<MmRemindersApi>('MmReminders');
