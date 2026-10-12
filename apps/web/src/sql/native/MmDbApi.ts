import type { BridgeSqlValue } from './BridgeSqlValue';

/**
 * The native SQLite plugin (MM-231): databases on the phone's own storage,
 * behind the same contract as the WebAssembly build. `open` with a `name`
 * opens one of the app's own, making it if need be; with a `path` it opens
 * an existing file, as a food pack is opened.
 */
export interface MmDbApi {
  open(options: { name?: string; path?: string; readOnly?: boolean }): Promise<{ db: number }>;
  select(options: { db: number; sql: string; params: BridgeSqlValue[] }): Promise<{ rows: Record<string, BridgeSqlValue>[] }>;
  execute(options: { db: number; sql: string; params: BridgeSqlValue[] }): Promise<void>;
  executeScript(options: { db: number; sql: string }): Promise<void>;
  close(options: { db: number }): Promise<void>;
}
