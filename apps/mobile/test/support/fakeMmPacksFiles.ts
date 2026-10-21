import type { MmPacksApi } from '../../src/foodCatalog/download/native/MmPacksApi';
import type { PackFileProgress } from '../../src/foodCatalog/download/native/PackFileProgress';
import type { PackHttp } from '../../src/foodCatalog/download/PackHttp';
import type { PackPartial } from '../../src/foodCatalog/download/PackPartial';
import type { PackStore } from '../../src/foodCatalog/download/PackStore';

const said = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * The native plugin's `httpGetToFile` stood in for (MM-387): what its thread
 * does, fetching from `http` and writing into `store`'s partial, telling only
 * counts as `packFileProgress` events. It answers nothing else, so an adapter
 * that sent the bytes over the bridge (`httpGet`, `write`) would fail here.
 * `calls` names each method asked for; `events` is everything told.
 */
export function fakeMmPacksFiles({ http, store }: { http: PackHttp; store: PackStore }) {
  const calls: string[] = [];
  const events: PackFileProgress[] = [];
  let listener: (progress: PackFileProgress) => void = () => undefined;
  const aborts = new Map<number, () => void>();
  let next = 1;
  const emit = (progress: PackFileProgress) => {
    events.push(progress);
    listener(progress);
  };

  const api = {
    addListener: async (event: string, told: (progress: PackFileProgress) => void) => {
      calls.push(`addListener:${event}`);
      if (event === 'packFileProgress') listener = told;
      return { remove: async () => undefined };
    },
    httpAbort: async ({ request }: { request: number }) => {
      calls.push('httpAbort');
      aborts.get(request)?.();
    },
    httpGetToFile: async ({ url, id, version, rangeStart }: { url: string; id: string; version: string; rangeStart?: number }) => {
      calls.push('httpGetToFile');
      const request = next++;
      const response = await http.get(new URL(url), { rangeStart });
      const status = response.statusCode;
      let aborted = false;
      aborts.set(request, () => {
        aborted = true;
        response.abort();
      });
      // The plugin's own thread, after the call has answered with the status.
      void (async () => {
        await Promise.resolve();
        if (status !== 200 && status !== 206) {
          emit({ request, bytes: 0, done: true });
          return;
        }
        let sink: PackPartial;
        try {
          sink = await store.writePartial(id, version, { append: status === 206 && (rangeStart ?? 0) > 0 });
        } catch (error) {
          response.abort();
          emit({ request, error: said(error), writeFailed: true });
          return;
        }
        let written = 0;
        try {
          for await (const chunk of response.body) {
            if (aborted) return;
            try {
              await sink.write(chunk);
            } catch (error) {
              response.abort();
              emit({ request, error: said(error), writeFailed: true });
              return;
            }
            written += chunk.length;
            emit({ request, bytes: written });
          }
          if (!aborted) emit({ request, bytes: written, done: true });
        } catch (error) {
          if (!aborted) emit({ request, error: said(error) });
        } finally {
          await sink.close();
        }
      })();
      return { request, status };
    },
  };
  return { api: api as unknown as MmPacksApi, calls, events };
}
