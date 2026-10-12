import { beforeEach, expect, it } from 'vitest';
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

/** MM-56: the download controller on a pretend store and a pretend network. From pack_download_controller_test.dart. */
const manifestUrl = 'https://packs.example.test/manifest.json';
let store: InMemoryPackStore;
let http: InMemoryPackHttp;
let listing: PackListing;
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
  http = new InMemoryPackHttp([[packUrl, d.gz]], { chunkSize: 256 });
  state = withUrl('');
});

const now = (): PackDownloadState => state.packDownload.state.peek();

/** Resolves once at least `bytes` have arrived. */
const received = (bytes: number) =>
  new Promise<void>((resolve) => {
    const stop = state.packDownload.state.subscribe((download) => {
      if ((download.progress?.receivedBytes ?? 0) < bytes) return;
      queueMicrotask(() => stop());
      resolve();
    });
  });

it('nothing is fetched until a download is started', async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(http.requests).toEqual([]);
  expect(now().status).toBe('idle');
});

it('a started download finishes and the pack is listed as installed', async () => {
  const seen: number[] = [];
  const stop = state.installedPacks.subscribe((packs) => {
    if (packs.ready) seen.push(packs.value.length);
  });
  await state.packDownload.start(listing);
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
  const running = state.packDownload.start(listing);
  await received(third);
  expect(now().status).toBe('running');
  state.packDownload.cancel();
  await running;
  expect(now().status).toBe('paused');
  expect(now().keptBytes).toBe(third);

  await state.packDownload.start(listing);
  expect(now().status).toBe('done');
  expect(http.requests[http.requests.length - 1]?.rangeStart).toBe(third);
});

it('discard throws away what was kept', async () => {
  http.stallAfterBytes = 512;
  const running = state.packDownload.start(listing);
  await received(512);
  state.packDownload.cancel();
  await running;
  await state.packDownload.discard();
  expect(now().status).toBe('idle');
  expect(await store.partialBytes('barcode_us', '2026-10-09')).toBe(0);
});

it('a dropped connection is a failure that keeps what arrived', async () => {
  http.dropAfterBytes = 1024;
  await state.packDownload.start(listing);
  expect(now().status).toBe('failed');
  expect(now().problem).toBe('connection');
  expect(now().keptBytes).toBe(1024);
  await state.packDownload.start(listing);
  expect(now().status).toBe('done');
});

const text = (value: string) => new TextEncoder().encode(value);

it('a manifest check reads the list once and only when asked', async () => {
  http.files.set(
    manifestUrl,
    text(
      '{"packs":[{"id":"barcode_us","title":"Barcode foods","version":"v1","formatVersion":1,' +
        `"url":"https://packs.example.test/p.gz","bytes":10,"sha256":"${'a'.repeat(64)}"}]}`,
    ),
  );
  const local = withUrl(manifestUrl);
  expect(http.requests).toEqual([]);
  await local.packManifest.check();
  expect(http.requests.map((request) => request.url)).toEqual([manifestUrl]);
  expect(local.packManifest.state.peek().manifest?.packs.map((pack) => pack.id)).toEqual(['barcode_us']);
});

it('an unreadable list or an unreachable host is reported, not thrown', async () => {
  http.files.set(manifestUrl, text('not json'));
  const local = withUrl(manifestUrl);
  await local.packManifest.check();
  expect(local.packManifest.state.peek().message).toBe('The list could not be read.');
  expect(local.packManifest.state.peek().manifest).toBeUndefined();

  http.files.delete(manifestUrl);
  await local.packManifest.check();
  expect(local.packManifest.state.peek().message).toBe('The host answered with an error (404).');
});

it('a build with no address for the list asks nothing', async () => {
  await state.packManifest.check();
  expect(http.requests).toEqual([]);
  expect(state.packManifest.state.peek()).toEqual({ checking: false });
});
