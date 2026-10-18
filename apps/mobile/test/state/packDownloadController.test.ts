import { afterEach, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryPackHttp } from '../../src/foodCatalog/download/InMemoryPackHttp';
import type { InMemoryPackStore } from '../../src/foodCatalog/download/InMemoryPackStore';
import type { PackListing } from '../../src/foodCatalog/download/PackListing';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { AppState } from '../../src/state/AppState';
import type { PackDownloadState } from '../../src/state/PackDownloadState';
import { fixtureDownload, memoryPackStore, packUrl } from '../support/fixtureDownload';
import { servicesOf } from '../support/servicesOf';

/**
 * MM-56, MM-384: the download controller on a pretend store and a pretend
 * network, one state per pack and as many running at once as are started.
 * From pack_download_controller_test.dart.
 */
const genericUrl = 'https://packs.example.test/generic.pack.gz';
let store: InMemoryPackStore;
let http: InMemoryPackHttp;
let listing: PackListing;
let generic: PackListing;
let state: AppState;

const withUrl = (url: string) =>
  new AppState({
    ...servicesOf(new InMemoryRepositories(), new FixedClock(CalendarDate.of(2026, 10, 9))),
    packStore: store,
    packHttp: http,
    packManifestUrl: url,
  });

beforeEach(async () => {
  store = memoryPackStore();
  const d = await fixtureDownload();
  listing = d.listing;
  const g = await fixtureDownload({ packId: 'generic' });
  generic = { ...g.listing, id: 'generic', title: 'Common foods', url: new URL(genericUrl) };
  http = new InMemoryPackHttp(
    [
      [packUrl, d.gz],
      [genericUrl, g.gz],
    ],
    { chunkSize: 256 },
  );
  state = withUrl('');
  // The list of downloads is derived, and worked out again only while something watches it, as the screens always do.
  stopWatching = state.packDownloads.downloads.subscribe(() => undefined);
});

let stopWatching: () => void = () => undefined;
afterEach(() => stopWatching());

const now = (id = 'barcode_us'): PackDownloadState => state.packDownloads.of(id) ?? { status: 'idle', keptBytes: 0 };

/** Resolves once at least `bytes` of `id` have arrived. */
const received = (bytes: number, id = 'barcode_us') =>
  new Promise<void>((resolve) => {
    const stop = state.packDownloads.state.subscribe((downloads) => {
      const download = downloads.find((d) => d.listing?.id === id);
      if ((download?.progress?.receivedBytes ?? 0) < bytes) return;
      queueMicrotask(() => stop());
      resolve();
    });
  });

it('nothing is fetched until a download is started', async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(http.requests).toEqual([]);
  expect(now().status).toBe('idle');
  expect(state.packDownloads.state.peek()).toEqual([]);
});

it('a started download finishes and the pack is listed as installed', async () => {
  const seen: number[] = [];
  const stop = state.installedPacks.subscribe((packs) => {
    if (packs.ready) seen.push(packs.value.length);
  });
  await state.packDownloads.start(listing);
  expect(now().status).toBe('done');
  await expect.poll(() => seen[seen.length - 1]).toBe(1);
  const packs = state.installedPacks.peek();
  stop();
  expect(packs.ready && packs.value[0]?.id).toBe('barcode_us');
  expect(packs.ready && packs.value[0]?.version).toBe('2026-10-09');
});

it('cancel stops it, keeps what arrived, and resume finishes it', async () => {
  const third = Math.trunc(listing.downloadBytes / 3);
  http.stallAfterBytes = third;
  const running = state.packDownloads.start(listing);
  await received(third);
  expect(now().status).toBe('running');
  state.packDownloads.cancel('barcode_us');
  await running;
  expect(now().status).toBe('paused');
  expect(now().keptBytes).toBe(third);

  await state.packDownloads.start(listing);
  expect(now().status).toBe('done');
  expect(http.requests[http.requests.length - 1]?.rangeStart).toBe(third);
});

it('discard throws away what was kept, and the pack is no longer listed', async () => {
  http.stallAfterBytes = 512;
  const running = state.packDownloads.start(listing);
  await received(512);
  state.packDownloads.cancel('barcode_us');
  await running;
  await state.packDownloads.discard('barcode_us');
  expect(state.packDownloads.of('barcode_us')).toBeUndefined();
  expect(await store.partialBytes('barcode_us', '2026-10-09')).toBe(0);
});

it('a dropped connection is a failure that keeps what arrived', async () => {
  http.dropAfterBytes = 1024;
  await state.packDownloads.start(listing);
  expect(now().status).toBe('failed');
  expect(now().problem).toBe('connection');
  expect(now().keptBytes).toBe(1024);
});

it('starting a running pack again changes nothing', async () => {
  http.stallAfterBytes = 512;
  const running = state.packDownloads.start(listing);
  await received(512);
  await state.packDownloads.start(listing);
  expect(http.requests.filter((r) => r.url === packUrl)).toHaveLength(1);
  state.packDownloads.cancel('barcode_us');
  await running;
});

it('two packs download at once, each with its own state, and both install (MM-384)', async () => {
  const installed: number[] = [];
  const stop = state.installedPacks.subscribe((packs) => {
    if (packs.ready) installed.push(packs.value.length);
  });
  const both = Promise.all([state.packDownloads.start(listing), state.packDownloads.start(generic)]);
  await expect.poll(() => state.packDownloads.state.peek().map((d) => d.listing?.id)).toEqual(['barcode_us', 'generic']);
  await both;
  expect(now('barcode_us').status).toBe('done');
  expect(now('generic').status).toBe('done');
  await expect.poll(() => installed[installed.length - 1]).toBe(2);
  stop();
  expect(http.requests.map((r) => r.url).sort()).toEqual([packUrl, genericUrl].sort());
});

it('cancelling one running pack leaves the other running (MM-384)', async () => {
  // The fake stalls the next response only, so the first pack asked for stalls.
  http.stallAfterBytes = 512;
  const first = state.packDownloads.start(listing);
  await received(512);
  const second = state.packDownloads.start(generic);
  await expect.poll(() => now('generic').status).not.toBe('idle');
  state.packDownloads.cancel('barcode_us');
  await first;
  expect(now('barcode_us').status).toBe('paused');
  await second;
  expect(now('generic').status).toBe('done');
  expect(state.packDownloads.state.peek().map((d) => [d.listing?.id, d.status])).toEqual([
    ['barcode_us', 'paused'],
    ['generic', 'done'],
  ]);
});

it('two presses before the first store read settles make one request (MM-384, the panel’s F2)', async () => {
  http.stallAfterBytes = 512;
  const first = state.packDownloads.start(listing);
  const second = state.packDownloads.start(listing);
  await received(512);
  expect(http.requests.filter((r) => r.url === packUrl)).toHaveLength(1);
  state.packDownloads.cancel('barcode_us');
  await Promise.all([first, second]);
  expect(now().status).toBe('paused');
});

it('each pack has its own cell, and one pack’s progress leaves the other’s alone (the panel’s F1)', async () => {
  const barcode = state.packDownloads.stateOf('barcode_us');
  expect(state.packDownloads.stateOf('barcode_us')).toBe(barcode);
  expect(state.packDownloads.stateOf('never').peek()).toEqual({ status: 'idle', keptBytes: 0 });
  const genericBefore = state.packDownloads.stateOf('generic').version;
  http.stallAfterBytes = 512;
  const running = state.packDownloads.start(listing);
  await received(512);
  expect(barcode.peek().status).toBe('running');
  expect(state.packDownloads.stateOf('generic').version).toBe(genericBefore);
  state.packDownloads.cancel('barcode_us');
  await running;
});
