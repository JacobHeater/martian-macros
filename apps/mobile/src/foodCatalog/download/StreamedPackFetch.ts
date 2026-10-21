import type { PackFileFetch } from './PackFileFetch';
import type { PackFileTransfer } from './PackFileTransfer';
import type { PackHttp } from './PackHttp';
import type { PackStore } from './PackStore';
import { PackWriteFailed } from './PackWriteFailed';

const said = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * `PackFileFetch` as a response read in the app and written to the store
 * chunk by chunk: what a browser, a story or a test uses, where nothing
 * native can do it (MM-387).
 */
export class StreamedPackFetch implements PackFileFetch {
  private readonly http: PackHttp;
  private readonly store: PackStore;

  constructor({ http, store }: { http: PackHttp; store: PackStore }) {
    this.http = http;
    this.store = store;
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
    const response = await this.http.get(url, { rangeStart });
    const status = response.statusCode;
    const store = this.store;
    // A server that ignores the range sends the whole file again.
    const append = status === 206 && rangeStart !== undefined && rangeStart > 0;
    return {
      statusCode: status,
      written: {
        async *[Symbol.asyncIterator]() {
          if (status !== 200 && status !== 206) return;
          let sink;
          try {
            sink = await store.writePartial(id, version, { append });
          } catch (error) {
            response.abort();
            throw new PackWriteFailed(said(error));
          }
          let written = 0;
          try {
            for await (const chunk of response.body) {
              try {
                await sink.write(chunk);
              } catch (error) {
                response.abort();
                throw new PackWriteFailed(said(error));
              }
              written += chunk.length;
              yield written;
            }
          } finally {
            await sink.close();
          }
        },
      },
      abort: () => response.abort(),
    };
  }
}
