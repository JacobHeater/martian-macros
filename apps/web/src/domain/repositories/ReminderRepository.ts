import type { ReminderReader } from './ReminderReader';
import type { ReminderWriter } from './ReminderWriter';

/** Reads and writes reminder settings (MM-146). */
export interface ReminderRepository extends ReminderReader, ReminderWriter {}
