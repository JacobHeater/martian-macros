import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fetchFoodSources } from '../src/food.ts';
import type { FoodSource } from '../src/foodSource.ts';

/**
 * MM-388: a source pinned to a newer release is downloaded again even when
 * a file of the same name is in the cache, and the provenance names the
 * day each file really arrived.
 */
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const source = (url: string): FoodSource => ({
  id: 'off',
  description: `Open Food Facts ${url}`,
  url,
  fileName: 'off.csv.gz',
  isZip: false,
});

/** A fetch that answers every address with its own text and counts the calls. */
function fakeFetch(): { fetch: typeof globalThis.fetch; calls: string[] } {
  const calls: string[] = [];
  const fetch = ((url: string | URL | Request) => {
    const at = String(url);
    calls.push(at);
    return Promise.resolve(new Response(`bytes of ${at}`));
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

function cacheDir(): string {
  const cache = mkdtempSync(join(tmpdir(), 'mm-food-'));
  dirs.push(cache);
  return cache;
}

test('reuses a cached file from the same address, keeping its download date', async () => {
  const cache = cacheDir();
  const { fetch, calls } = fakeFetch();
  assert.equal(await fetchFoodSources(cache, { sources: [source('https://host.test/v1')], fetch, today: '2026-10-09' }), 0);
  assert.equal(await fetchFoodSources(cache, { sources: [source('https://host.test/v1')], fetch, today: '2026-10-18' }), 0);
  assert.deepEqual(calls, ['https://host.test/v1']);
  const provenance = JSON.parse(readFileSync(join(cache, 'provenance.json'), 'utf8')) as { builtOn: string; sources: string[] };
  assert.equal(provenance.builtOn, '2026-10-18');
  assert.deepEqual(provenance.sources, ['Open Food Facts https://host.test/v1 (downloaded 2026-10-09)']);
});

test('downloads again when the pin moves to another address, and the provenance names the new release', async () => {
  const cache = cacheDir();
  const { fetch, calls } = fakeFetch();
  await fetchFoodSources(cache, { sources: [source('https://host.test/v1')], fetch, today: '2026-10-09' });
  assert.equal(await fetchFoodSources(cache, { sources: [source('https://host.test/v2')], fetch, today: '2026-10-18' }), 0);
  assert.deepEqual(calls, ['https://host.test/v1', 'https://host.test/v2']);
  assert.equal(readFileSync(join(cache, 'off.csv.gz'), 'utf8'), 'bytes of https://host.test/v2');
  const provenance = JSON.parse(readFileSync(join(cache, 'provenance.json'), 'utf8')) as { sources: string[] };
  assert.deepEqual(provenance.sources, ['Open Food Facts https://host.test/v2 (downloaded 2026-10-18)']);
  assert.equal(existsSync(join(cache, 'downloads.json')), true);
});

test('a file left by an older tool with no record of its address is downloaded again', async () => {
  const cache = cacheDir();
  const { fetch, calls } = fakeFetch();
  await fetchFoodSources(cache, { sources: [source('https://host.test/v1')], fetch, today: '2026-10-09' });
  rmSync(join(cache, 'downloads.json'));
  await fetchFoodSources(cache, { sources: [source('https://host.test/v1')], fetch, today: '2026-10-18' });
  assert.equal(calls.length, 2);
});
