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
  requestPermission(options: { types: string[] }): Promise<{ types: string[] }>;
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
  changesToken(options: { type: string }): Promise<{ token: string }>;
  changes(options: { token: string }): Promise<{
    expired: boolean;
    nextToken: string;
    hasMore: boolean;
    upserted: MmHealthRecord[];
    deletedIds: string[];
  }>;
}
