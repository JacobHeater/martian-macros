import type { PluginListenerHandle } from '@capacitor/core';
import type { PackFileProgress } from './PackFileProgress';
import type { PackHttpChunk } from './PackHttpChunk';

/**
 * The native food-pack plugin (MM-56): pack files on the phone's own
 * storage, kept apart from the user's database, and the one HTTP fetch the
 * app ever makes. A response's bytes arrive as `packHttpChunk` events, in
 * order, each carrying base64: only the list of packs on offer is read that
 * way. A pack file goes from the connection into its partial natively, by
 * `httpGetToFile`, and only `packFileProgress` counts reach the app (MM-387).
 */
export interface MmPacksApi {
  installed(): Promise<{ packs: { id: string; version: string; bytes: number; title?: string; path: string }[] }>;
  partialBytes(options: { id: string; version: string }): Promise<{ bytes: number }>;
  writePartial(options: { id: string; version: string; append: boolean }): Promise<{ writer: number }>;
  write(options: { writer: number; data: string }): Promise<void>;
  closeWriter(options: { writer: number }): Promise<void>;
  partialSha256(options: { id: string; version: string }): Promise<{ sha256: string }>;
  discardPartial(options: { id: string; version: string }): Promise<void>;
  stage(options: { id: string; version: string; gzip: boolean }): Promise<{ path: string }>;
  discardStaged(options: { id: string }): Promise<void>;
  commit(options: { id: string; version: string; title?: string }): Promise<void>;
  remove(options: { id: string }): Promise<void>;
  httpGet(options: { url: string; rangeStart?: number }): Promise<{ request: number; status: number }>;
  httpAbort(options: { request: number }): Promise<void>;
  /**
   * Fetches `url` into the partial of `version` of pack `id`: from
   * `rangeStart` on when the server answers 206, from nothing on 200, and
   * nothing written for any other status. Settles with the status once it
   * is known; `httpAbort` stops it.
   */
  httpGetToFile(options: { url: string; id: string; version: string; rangeStart?: number }): Promise<{ request: number; status: number }>;
  addListener(event: 'packHttpChunk', listener: (chunk: PackHttpChunk) => void): Promise<PluginListenerHandle>;
  addListener(event: 'packFileProgress', listener: (progress: PackFileProgress) => void): Promise<PluginListenerHandle>;
}
