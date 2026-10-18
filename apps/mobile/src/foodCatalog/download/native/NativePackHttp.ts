import { bytesOfBase64 } from '../../../lang/bytesOfBase64';
import type { PackHttp } from '../PackHttp';
import type { PackResponse } from '../PackResponse';
import type { MmPacksApi } from './MmPacksApi';
import type { PackHttpChunk } from './PackHttpChunk';

/** What has arrived of one response ahead of its reader, and how to wake the reader. */
interface Arrivals {
  chunks: PackHttpChunk[];
  wake?: (() => void) | undefined;
}

/**
 * `PackHttp` over the native plugin (MM-56): the plugin streams each
 * response's bytes as events, and this adapter hands them on in order as
 * the response's body.
 */
export class NativePackHttp implements PackHttp {
  private readonly api: MmPacksApi;
  private readonly arrivals = new Map<number, Arrivals>();

  constructor(api: MmPacksApi) {
    this.api = api;
    void this.api.addListener('packHttpChunk', (chunk) => this.arrived(chunk));
  }

  private at(request: number): Arrivals {
    let found = this.arrivals.get(request);
    if (found === undefined) {
      found = { chunks: [] };
      this.arrivals.set(request, found);
    }
    return found;
  }

  private arrived(chunk: PackHttpChunk): void {
    // A chunk for a response nobody reads any more is dropped, not kept (MM-384, the panel's F5).
    if (this.closed.has(chunk.request)) return;
    const arrivals = this.at(chunk.request);
    arrivals.chunks.push(chunk);
    arrivals.wake?.();
    arrivals.wake = undefined;
  }

  /** Requests whose bodies were read to the end or aborted; chunks for them are dropped. */
  private readonly closed = new Set<number>();

  async get(url: URL, options?: { rangeStart?: number | undefined }): Promise<PackResponse> {
    const start = options?.rangeStart;
    const { request, status } = await this.api.httpGet({
      url: url.toString(),
      ...(start === undefined ? {} : { rangeStart: start }),
    });
    const { api, arrivals, closed } = this;
    const mine = this.at(request);
    return {
      statusCode: status,
      body: {
        async *[Symbol.asyncIterator]() {
          try {
            for (;;) {
              const next = mine.chunks.shift();
              if (next === undefined) {
                await new Promise<void>((wake) => {
                  mine.wake = wake;
                });
                continue;
              }
              if (next.error !== undefined) throw new Error(next.error);
              if (next.done === true) return;
              if (next.data !== undefined) yield bytesOfBase64(next.data);
            }
          } finally {
            arrivals.delete(request);
            closed.add(request);
          }
        },
      },
      abort: () => {
        // A response nobody reads must not keep its chunks (MM-384, the panel's F5).
        arrivals.delete(request);
        closed.add(request);
        void api.httpAbort({ request }).catch(() => undefined);
      },
    };
  }
}
