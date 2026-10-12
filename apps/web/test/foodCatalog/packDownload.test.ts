import { beforeEach, expect, it } from 'vitest';
import { InMemoryPackHttp } from '../../src/foodCatalog/download/InMemoryPackHttp';
import type { InMemoryPackStore } from '../../src/foodCatalog/download/InMemoryPackStore';
import { openInstalledCatalog } from '../../src/foodCatalog/download/openInstalledCatalog';
import { PackDownload } from '../../src/foodCatalog/download/PackDownload';
import { PackDownloadCancelled } from '../../src/foodCatalog/download/PackDownloadCancelled';
import { PackDownloadFailed } from '../../src/foodCatalog/download/PackDownloadFailed';
import type { PackDownloadPhase } from '../../src/foodCatalog/download/PackDownloadPhase';
import type { PackDownloadProblem } from '../../src/foodCatalog/download/PackDownloadProblem';
import type { PackListing } from '../../src/foodCatalog/download/PackListing';
import { fixtureDownload, gzipped, memoryPackStore, packUrl, sha256Hex } from '../support/fixtureDownload';

/** MM-56: one download of one pack. Carried over from pack_download_test.dart; the manifest's cases are in packManifest.test.ts. */
let store: InMemoryPackStore;

beforeEach(() => {
  store = memoryPackStore();
});

const serving = (gz: Uint8Array, chunkSize = 256) => new InMemoryPackHttp([[packUrl, gz]], { chunkSize });
const start = (listing: PackListing, http: InMemoryPackHttp) => PackDownload.start({ listing, http, store });
const installed = async () => (await store.installed()).find((pack) => pack.id === 'barcode_us');
const finds = async (query: string) => (await (await openInstalledCatalog(store)).search(query)).length;

async function failure(download: PackDownload): Promise<PackDownloadProblem | undefined> {
  try {
    await download.done;
    return undefined;
  } catch (error) {
    expect(error).toBeInstanceOf(PackDownloadFailed);
    return (error as PackDownloadFailed).problem;
  }
}

/** Resolves once `download` has received at least `bytes`. */
const received = (download: PackDownload, bytes: number) =>
  new Promise<void>((resolve) => {
    download.onProgress((progress) => {
      if (progress.receivedBytes >= bytes) resolve();
    });
  });

it('a download is installed and the pack opens', async () => {
  const d = await fixtureDownload();
  const download = start(d.listing, serving(d.gz));
  const phases: PackDownloadPhase[] = [];
  download.onProgress((p) => phases.push(p.phase));
  await download.done;

  const pack = await installed();
  expect(pack?.version).toBe('2026-10-09');
  // Remembered, so the list can name it without the network.
  expect(pack?.title).toBe('Barcode foods, United States');
  expect(await finds('banana')).toBeGreaterThan(0);
  expect(phases[0]).toBe('downloading');
  expect([...new Set(phases)]).toEqual(['downloading', 'checking', 'installing']);
  expect(await store.partialBytes('barcode_us', '2026-10-09')).toBe(0);
});

it('progress counts bytes up to the total', async () => {
  const d = await fixtureDownload();
  const download = start(d.listing, serving(d.gz));
  const seen: number[] = [];
  download.onProgress((p) => {
    if (p.phase === 'downloading') seen.push(p.receivedBytes);
  });
  await download.done;
  expect(seen[seen.length - 1]).toBe(d.gz.length);
  expect(seen).toEqual([...seen].sort((a, b) => a - b));
  expect(seen.length).toBeGreaterThan(5);
});

it('a download that loses its connection resumes where it stopped', async () => {
  const d = await fixtureDownload();
  const http = serving(d.gz);
  const half = Math.trunc(d.gz.length / 2);
  http.dropAfterBytes = half;
  expect(await failure(start(d.listing, http))).toBe('connection');
  // What arrived is kept.
  expect(await store.partialBytes('barcode_us', '2026-10-09')).toBe(half);

  await start(d.listing, http).done;
  // It asked for the rest.
  expect(http.requests[http.requests.length - 1]?.rangeStart).toBe(half);
  expect(await installed()).toBeDefined();
  expect(await finds('banana')).toBeGreaterThan(0);
});

it('a server that ignores the range restarts cleanly', async () => {
  const d = await fixtureDownload();
  const http = serving(d.gz);
  http.dropAfterBytes = 1000;
  http.supportsRange = false;
  expect(await failure(start(d.listing, http))).toBe('connection');
  await start(d.listing, http).done;
  expect(await installed()).toBeDefined();
});

it('a wrong checksum is discarded and the old pack keeps working', async () => {
  const good = await fixtureDownload({ version: 'old' });
  await start(good.listing, serving(good.gz)).done;
  expect((await installed())?.version).toBe('old');

  const bad = await fixtureDownload({ version: 'new', sha: 'a'.repeat(64) });
  expect(await failure(start(bad.listing, serving(bad.gz)))).toBe('checksumMismatch');
  expect(await store.partialBytes('barcode_us', 'new')).toBe(0);
  expect((await installed())?.version).toBe('old');
  expect(await finds('banana')).toBeGreaterThan(0);
});

it('cancelling stops at once, keeps the partial file and the old pack', async () => {
  const good = await fixtureDownload({ version: 'old' });
  await start(good.listing, serving(good.gz)).done;

  const d = await fixtureDownload({ version: 'new' });
  const http = serving(d.gz);
  const stalledAt = Math.trunc(d.gz.length / 4);
  http.stallAfterBytes = stalledAt;
  const download = start(d.listing, http);
  await received(download, stalledAt);
  download.cancel();
  await expect(download.done).rejects.toBeInstanceOf(PackDownloadCancelled);
  expect(await store.partialBytes('barcode_us', 'new')).toBe(stalledAt);
  expect((await installed())?.version).toBe('old');
});

it('cancelled downloads can be started again and finish', async () => {
  const d = await fixtureDownload();
  const http = serving(d.gz);
  const stalledAt = Math.trunc(d.gz.length / 4);
  http.stallAfterBytes = stalledAt;
  const first = start(d.listing, http);
  await received(first, stalledAt);
  first.cancel();
  await expect(first.done).rejects.toBeInstanceOf(PackDownloadCancelled);

  await start(d.listing, http).done;
  expect(http.requests[http.requests.length - 1]?.rangeStart).toBe(stalledAt);
  expect(await installed()).toBeDefined();
});

it('an error status from the host is reported and nothing is installed', async () => {
  const d = await fixtureDownload();
  const http = serving(d.gz);
  http.failWithStatus = 503;
  expect(await failure(start(d.listing, http))).toBe('serverError');
  expect(await installed()).toBeUndefined();
});

it('a pack with the wrong id or an unknown format is refused', async () => {
  const wrongId = await fixtureDownload({ packId: 'something_else' });
  expect(await failure(start(wrongId.listing, serving(wrongId.gz)))).toBe('unreadablePack');
  expect(await installed()).toBeUndefined();

  const notAPack = await gzipped(new Uint8Array(5000).fill(7));
  const listing: PackListing = {
    id: 'barcode_us',
    title: 't',
    version: 'x',
    formatVersion: 1,
    url: new URL(packUrl),
    downloadBytes: notAPack.length,
    sha256: await sha256Hex(notAPack),
    gzip: true,
  };
  expect(await failure(start(listing, serving(notAPack)))).toBe('unreadablePack');
  expect(await installed()).toBeUndefined();
  expect(await store.partialBytes('barcode_us', 'x')).toBe(0);
});

it('removing a pack deletes it and what was left from downloading it', async () => {
  const d = await fixtureDownload();
  await start(d.listing, serving(d.gz)).done;
  const later = await store.writePartial('barcode_us', 'later', { append: false });
  await later.write(new Uint8Array([1, 2, 3]));
  await later.close();
  await store.remove('barcode_us');
  expect(await installed()).toBeUndefined();
  expect(await store.partialBytes('barcode_us', 'later')).toBe(0);
});

it('a pack that will not open is skipped, and the others still answer', async () => {
  const d = await fixtureDownload();
  await start(d.listing, serving(d.gz)).done;
  const broken = {
    ...store,
    installed: async () => [{ id: 'gone', version: '1', bytes: 0 }, ...(await store.installed())],
    open: (pack: { id: string; version: string; bytes: number }) => store.open(pack),
  };
  const catalog = await openInstalledCatalog(Object.assign(Object.create(store), broken));
  expect(catalog.packs).toHaveLength(1);
});
