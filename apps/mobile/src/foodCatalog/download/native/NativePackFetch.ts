import type { PackFileFetch } from '../PackFileFetch';
import type { PackFileTransfer } from '../PackFileTransfer';
import { PackWriteFailed } from '../PackWriteFailed';
import type { MmPacksApi } from './MmPacksApi';
import type { PackFileProgress } from './PackFileProgress';

/** What has been told of one transfer ahead of its reader, and how to wake the reader. */
interface Told {
  /** The latest count; only the latest is kept, so nothing piles up however fast the file fills. */
  bytes: number;
  end?: { error?: string | undefined; writeFailed: boolean } | undefined;
  wake?: (() => void) | undefined;
}

/**
 * `PackFileFetch` over the native plugin (MM-387): the plugin reads the
 * connection on its own thread and writes it straight into the pack's
 * partial file, and tells the app only how many bytes have landed. No byte
 * of the pack crosses into the WebView.
 */
export class NativePackFetch implements PackFileFetch {
  private readonly api: MmPacksApi;
  private readonly told = new Map<number, Told>();
  /** Transfers read to the end or aborted; anything more told of them is dropped. */
  private readonly closed = new Set<number>();

  constructor(api: MmPacksApi) {
    this.api = api;
    void this.api.addListener('packFileProgress', (progress) => this.arrived(progress));
  }

  private at(request: number): Told {
    let found = this.told.get(request);
    if (found === undefined) {
      found = { bytes: 0 };
      this.told.set(request, found);
    }
    return found;
  }

  private arrived(progress: PackFileProgress): void {
    if (this.closed.has(progress.request)) return;
    const told = this.at(progress.request);
    if (progress.bytes !== undefined && progress.bytes > told.bytes) told.bytes = progress.bytes;
    if (progress.error !== undefined) told.end = { error: progress.error, writeFailed: progress.writeFailed === true };
    else if (progress.done === true) told.end = { writeFailed: false };
    told.wake?.();
    told.wake = undefined;
  }

  private forget(request: number): void {
    this.told.delete(request);
    this.closed.add(request);
  }

  async fetchInto({
    url,
    id,
    version,
    rangeStart,
  }: {
    url: URL;
    id: string;
    version: string;
    rangeStart?: number | undefined;
  }): Promise<PackFileTransfer> {
    const { request, status } = await this.api.httpGetToFile({
      url: url.toString(),
      id,
      version,
      ...(rangeStart === undefined ? {} : { rangeStart }),
    });
    const mine = this.at(request);
    const forget = () => this.forget(request);
    const api = this.api;
    return {
      statusCode: status,
      written: {
        async *[Symbol.asyncIterator]() {
          let given = 0;
          try {
            for (;;) {
              if (mine.bytes > given) {
                given = mine.bytes;
                yield given;
                continue;
              }
              const end = mine.end;
              if (end !== undefined) {
                if (end.error === undefined) return;
                throw end.writeFailed ? new PackWriteFailed(end.error) : new Error(end.error);
              }
              await new Promise<void>((wake) => {
                mine.wake = wake;
              });
            }
          } finally {
            forget();
          }
        },
      },
      abort: () => {
        forget();
        // Whoever is waiting on the next count is told now: nothing more will be (MM-471).
        mine.end ??= { error: 'The transfer was aborted.', writeFailed: false };
        mine.wake?.();
        mine.wake = undefined;
        void api.httpAbort({ request }).catch(() => undefined);
      },
    };
  }
}
