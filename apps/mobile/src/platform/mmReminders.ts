import { registerPlugin } from '@capacitor/core';
import type { MmExactAlarmsApi } from './MmExactAlarmsApi';
import type { MmRemindersApi } from './MmRemindersApi';

/** The native reminders plugin, which answers only inside the native shell. Its exact-alarm part is MM-248's. */
export const mmReminders = registerPlugin<MmRemindersApi & MmExactAlarmsApi>('MmReminders');
