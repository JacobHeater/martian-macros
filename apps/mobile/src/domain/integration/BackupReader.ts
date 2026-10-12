import type { Outcome } from './Outcome';

/** Reads backup blobs from wherever they are stored. */
export interface BackupReader {
  /** The names of every stored blob, sorted. */
  list(): Promise<Outcome<string[]>>;

  /** The blob named `name`, or `NotFound`. */
  get(name: string): Promise<Outcome<Uint8Array>>;
}
