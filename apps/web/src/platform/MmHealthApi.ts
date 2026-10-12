import type { MmHealthRecord } from './MmHealthRecord';

/**
 * The native Health Connect plugin (MM-68). It only reads: nothing is
 * written to the user's health data. A call the platform refuses is
 * rejected, never answered with nothing.
 */
export interface MmHealthApi {
  status(): Promise<{ status: 'available' | 'unavailable' | 'updateRequired' }>;
  permitted(options: { types: string[] }): Promise<{ types: string[] }>;
  requestPermission(options: { types: string[] }): Promise<{ types: string[] }>;
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
