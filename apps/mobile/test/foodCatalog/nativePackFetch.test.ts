import { describe, expect, it } from 'vitest';
import { InMemoryPackHttp } from '../../src/foodCatalog/download/InMemoryPackHttp';
import type { MmPacksApi } from '../../src/foodCatalog/download/native/MmPacksApi';
import { NativePackFetch } from '../../src/foodCatalog/download/native/NativePackFetch';
import type { PackFileProgress } from '../../src/foodCatalog/download/native/PackFileProgress';
import { PackDownload } from '../../src/foodCatalog/download/PackDownload';
import { PackWriteFailed } from '../../src/foodCatalog/download/PackWriteFailed';
import { fakeMmPacksFiles } from '../support/fakeMmPacksFiles';
import { fixtureDownload, memoryPackStore, packUrl } from '../support/fixtureDownload';

/** The plugin's file side alone, driven by hand. */
function handDriven(status = 200) {
  const asked: { url: string; id: string; version: string; rangeStart?: number }[] = [];
  const aborted: number[] = [];
  let emit: (progress: PackFileProgress) => void = () => undefined;
  let next = 1;
  const api = {
    httpGetToFile: async (options: { url: string; id: string; version: string; rangeStart?: number }) => {
      asked.push(options);
      return { request: next++, status };
    },
    httpAbort: async ({ request }: { request: number }) => {
      aborted.push(request);
    },
    addListener: async (_event: 'packFileProgress', listener: (progress: PackFileProgress) => void) => {
      emit = listener;
      return { remove: async () => undefined };
    },
  } as unknown as MmPacksApi;
  return { api, asked, aborted, emit: (progress: PackFileProgress) => emit(progress) };
}

const request = { url: new URL('https://packs.example/a.pack.gz'), id: 'a', version: '1' };

describe('NativePackFetch (MM-387)', () => {
  it('a download over the plugin installs, and nothing but counts crosses the bridge', async () => {
    const d = await fixtureDownload();
    const store = memoryPackStore();
    const http = new InMemoryPackHttp([[packUrl, d.gz]], { chunkSize: 256 });
    const plugin = fakeMmPacksFiles({ http, store });
    await PackDownload.start({ listing: d.listing, fetch: new NativePackFetch(plugin.api), store }).done;
    expect((await store.installed()).map((pack) => pack.id)).toEqual(['barcode_us']);
    expect(plugin.calls.filter((call) => call !== 'httpGetToFile' && !call.startsWith('addListener'))).toEqual([]);
    expect(plugin.events.length).toBeGreaterThan(0);
    for (const event of plugin.events) expect(Object.keys(event).sort()).not.toContain('data');
  });

  it('passes the pack, its version and the offset on, the offset only when there is one', async () => {
    const { api, asked } = handDriven(206);
    const fetch = new NativePackFetch(api);
    await fetch.fetchInto({ ...request, rangeStart: 1200 });
    await fetch.fetchInto(request);
    expect(asked[0]).toEqual({ url: 'https://packs.example/a.pack.gz', id: 'a', version: '1', rangeStart: 1200 });
    expect(asked[1] !== undefined && 'rangeStart' in asked[1]).toBe(false);
  });

  it('keeps only the latest count, so a fast file never piles up events', async () => {
    const { api, emit } = handDriven();
    const transfer = await new NativePackFetch(api).fetchInto(request);
    emit({ request: 1, bytes: 100 });
    emit({ request: 1, bytes: 200 });
    emit({ request: 1, bytes: 300, done: true });
    const told: number[] = [];
    for await (const count of transfer.written) told.push(count);
    expect(told).toEqual([300]);
  });

  it('tells a failure of the file apart from the connection’s', async () => {
    const { api, emit } = handDriven();
    const fetch = new NativePackFetch(api);
    const file = await fetch.fetchInto(request);
    const line = await fetch.fetchInto(request);
    emit({ request: 1, error: 'No space left on device', writeFailed: true });
    emit({ request: 2, error: 'the connection dropped' });
    const drain = async (written: AsyncIterable<number>) => {
      for await (const count of written) expect(count).toBeGreaterThanOrEqual(0);
    };
    await expect(drain(file.written)).rejects.toBeInstanceOf(PackWriteFailed);
    const dropped = await drain(line.written).then(
      () => undefined,
      (error: unknown) => error,
    );
    expect(dropped).toBeInstanceOf(Error);
    expect(dropped).not.toBeInstanceOf(PackWriteFailed);
  });

  it('two transfers at once keep their counts apart', async () => {
    const { api, emit } = handDriven();
    const fetch = new NativePackFetch(api);
    const first = await fetch.fetchInto(request);
    const second = await fetch.fetchInto({ ...request, id: 'b' });
    emit({ request: 2, bytes: 70, done: true });
    emit({ request: 1, bytes: 40, done: true });
    const last = async (written: AsyncIterable<number>) => {
      let count = 0;
      for await (const told of written) count = told;
      return count;
    };
    expect(await last(first.written)).toBe(40);
    expect(await last(second.written)).toBe(70);
  });

  it('MM-471: abort wakes a reader waiting on the next count, and tells the plugin which transfer to stop', async () => {
    const { api, aborted } = handDriven();
    const transfer = await new NativePackFetch(api).fetchInto(request);
    const waiting = transfer.written[Symbol.asyncIterator]()
      .next()
      .then(
        () => 'ended',
        () => 'ended',
      );
    transfer.abort();
    expect(await waiting).toBe('ended');
    expect(aborted).toEqual([1]);
  });
});
