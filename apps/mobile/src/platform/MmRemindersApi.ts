/**
 * The native reminders plugin (MM-146): notifications scheduled on the
 * phone itself. No push service and no token; nothing leaves the device.
 */
export interface MmRemindersApi {
  /** Asks the system for permission to show notifications. */
  requestPermission(): Promise<{ granted: boolean }>;

  /** Cancels everything scheduled before and schedules exactly these. */
  replaceAll(options: { reminders: { title: string; atMs: number }[] }): Promise<void>;
}
