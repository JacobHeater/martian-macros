import type { PackResponse } from './PackResponse';

/**
 * The one thing the pack download needs from the network: fetch a file,
 * optionally from a byte offset. A fake stands in for it in tests.
 */
export interface PackHttp {
  get(url: URL, options?: { rangeStart?: number | undefined }): Promise<PackResponse>;
}
