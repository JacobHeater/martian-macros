import type { PackFileTransfer } from './PackFileTransfer';

/**
 * The network and the unfinished download meeting in one step (MM-387):
 * fetch a pack file into its partial, so on the phone the bytes go from the
 * connection to the file natively and only their count reaches the app.
 */
export interface PackFileFetch {
  /**
   * Asks for `url`, from `rangeStart` when given, and writes the body into
   * the unfinished download of `version` of pack `id`: on at the offset
   * asked for when the server honours the range (206), from nothing when it
   * sends the whole file (200).
   */
  fetchInto(request: { url: URL; id: string; version: string; rangeStart?: number | undefined }): Promise<PackFileTransfer>;
}
