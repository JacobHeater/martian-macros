import { PackConnectionDropped } from './PackConnectionDropped';
import type { PackHttp } from './PackHttp';
import type { PackResponse } from './PackResponse';

const empty: AsyncIterable<Uint8Array> = {
  [Symbol.asyncIterator]: () => ({ next: () => Promise.resolve({ done: true, value: undefined }) }),
};

/**
 * A `PackHttp` that serves files from memory, for tests and demos: no
 * network. It honours range requests like a real server, and can be told
 * to drop the connection or stall.
 */
export class InMemoryPackHttp implements PackHttp {
  /** The files served, by the address they are asked for at. */
  readonly files: Map<string, Uint8Array>;
  readonly chunkSize: number;

  /**
   * Cut the connection after this many bytes of the next response, as if
   * the phone lost signal. It applies once.
   */
  dropAfterBytes: number | undefined;

  /**
   * Stop sending after this many bytes of the next response but keep the
   * connection open, until the response is aborted.
   */
  stallAfterBytes: number | undefined;

  /** Answer every request with this status instead of the file. */
  failWithStatus: number | undefined;

  /** Whether the server honours `Range` (a real one does). */
  supportsRange = true;

  /** Each request made: the address and the offset asked for. */
  readonly requests: { url: string; rangeStart: number | undefined }[] = [];

  constructor(files: Iterable<readonly [string, Uint8Array]> = [], { chunkSize = 64 * 1024 }: { chunkSize?: number } = {}) {
    this.files = new Map(files);
    this.chunkSize = chunkSize;
  }

  get(url: URL, { rangeStart }: { rangeStart?: number | undefined } = {}): Promise<PackResponse> {
    this.requests.push({ url: url.toString(), rangeStart });
    if (this.failWithStatus !== undefined) {
      return Promise.resolve({ statusCode: this.failWithStatus, body: empty, abort: () => undefined });
    }
    const file = this.files.get(url.toString());
    if (file === undefined) return Promise.resolve({ statusCode: 404, body: empty, abort: () => undefined });
    const bytes: Uint8Array = file;
    const start = this.supportsRange ? (rangeStart ?? 0) : 0;
    const drop = this.dropAfterBytes;
    const stall = this.stallAfterBytes;
    this.dropAfterBytes = undefined;
    this.stallAfterBytes = undefined;
    const chunkSize = this.chunkSize;
    let aborted = false;
    let release: (() => void) | undefined;

    async function* body(): AsyncGenerator<Uint8Array> {
      let sent = start;
      while (sent < bytes.length && !aborted) {
        await Promise.resolve();
        if (aborted) return;
        let end = Math.min(sent + chunkSize, bytes.length);
        if (drop !== undefined && end > start + drop) end = start + drop;
        if (stall !== undefined && end > start + stall) end = start + stall;
        if (end > sent) yield bytes.subarray(sent, end);
        sent = end;
        if (drop !== undefined && sent >= start + drop) throw new PackConnectionDropped();
        if (stall !== undefined && sent >= start + stall) {
          // Nothing more comes, and the connection stays open until it is aborted.
          await new Promise<void>((resolve) => {
            release = resolve;
            if (aborted) resolve();
          });
          return;
        }
      }
    }

    return Promise.resolve({
      statusCode: start > 0 ? 206 : 200,
      body: body(),
      abort: () => {
        aborted = true;
        release?.();
      },
    });
  }
}
