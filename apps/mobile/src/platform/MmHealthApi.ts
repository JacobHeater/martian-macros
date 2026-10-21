import type { MmHealthRecord } from './MmHealthRecord';

/**
 * The native health plugin's reading (MM-68, MM-69). Writing is
 * `MmHealthWritingApi` and `MmHealthWorkoutsApi`, each kind with a
 * permission of its own, never asked for with reading. A call the platform
 * refuses is rejected, never answered with nothing.
 */
export interface MmHealthApi {
  status(): Promise<{ status: 'available' | 'unavailable' | 'updateRequired' }>;
  permitted(options: { types: string[] }): Promise<{ types: string[] }>;
  /**
   * `shown` is false when the answer came back without the platform's
   * question having been shown, as Health Connect does once a request has
   * been refused more than twice (MM-323). Apple Health does not say.
   */
  requestPermission(options: { types: string[] }): Promise<{ types: string[]; shown?: boolean }>;
  /**
   * Opens Health Connect's screen of this app's permissions (MM-323),
   * answering once the person is back; `opened` is false where it could not
   * be opened. Health Connect only: an iPhone has no such screen to open.
   */
  openPermissions(): Promise<{ opened: boolean }>;
  /**
   * Whether readings from before the platform's default window can be read
   * (MM-73): Health Connect's history permission; always on Apple Health.
   */
  historyPermitted(): Promise<{ granted: boolean }>;
  /**
   * Asks for the history permission (MM-73), the first time only: the
   * plugin keeps in its own preferences that it asked, and after that only
   * says how it stands.
   */
  requestHistory(): Promise<{ granted: boolean }>;
  read(options: { type: string; fromMs: number; toMs: number }): Promise<{ records: MmHealthRecord[] }>;
  /**
   * Each local day's steps from `fromMs` up to `toMs`, both local
   * midnights, as the platform totals them with the person's own source
   * priority (MM-442): Health Connect's aggregate by period, HealthKit's
   * statistics collection. `startMs` is the day's local midnight.
   */
  dailySteps(options: { fromMs: number; toMs: number }): Promise<{ days: { startMs: number; steps: number }[] }>;
  changesToken(options: { type: string }): Promise<{ token: string }>;
  changes(options: { token: string }): Promise<{
    expired: boolean;
    nextToken: string;
    hasMore: boolean;
    upserted: MmHealthRecord[];
    deletedIds: string[];
  }>;
}
