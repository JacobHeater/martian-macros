import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { PackManifest } from '../../src/foodCatalog/download/PackManifest';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodPackFormat } from '../../src/foodCatalog/FoodPackFormat';
import { openPackFile } from '../../src/foodPipeline/node/openPackFile';
import { packagePacks } from '../../src/foodPipeline/node/packagePacks';
import { writePackFile } from '../../src/foodPipeline/node/writePackFile';
import { ArgumentError } from '../../src/lang/ArgumentError';

let dir: string;
const base = new URL('https://packs.example.test/food/');
const published = () => join(dir, 'publish', 'barcode_us-2026-10-09.pack.gz');

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'publish-'));
  mkdirSync(join(dir, 'packs'));
  await writePackFile(
    join(dir, 'packs', 'barcode_us.pack'),
    {
      packId: 'barcode_us',
      formatVersion: FoodPackFormat.version,
      builtOn: '2026-10-09',
      region: 'US',
      sources: ['test'],
      license: 'test',
      attribution: 'test',
    },
    FixturePack.entries,
  );
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = () => packagePacks({ packs: join(dir, 'packs'), out: join(dir, 'publish'), baseUrl: base });

const manifest = () => PackManifest.parse(readFileSync(join(dir, 'publish', 'manifest.json'), 'utf8'));

it('the manifest describes each compressed file exactly', async () => {
  await run();
  const listing = manifest().pack('barcode_us');
  expect(listing?.url.href).toBe(new URL('barcode_us-2026-10-09.pack.gz', base).href);
  expect(listing?.downloadBytes).toBe(statSync(published()).size);
  expect(listing?.sha256).toBe(createHash('sha256').update(readFileSync(published())).digest('hex'));
  expect(listing?.title).toBe('Barcode foods, United States');
  expect(listing?.version).toBe('2026-10-09');
});

it('packaging the same pack twice gives the same bytes', async () => {
  await run();
  const first = readFileSync(published());
  rmSync(join(dir, 'publish'), { recursive: true });
  await run();
  expect(readFileSync(published()).equals(first)).toBe(true);
});

// In Dart this downloaded and installed the file through the app's own
// download code. That code is not carried over yet (MM-231), so this keeps
// what can be kept: the published file, unpacked, is a pack that reads.
it('a published pack, unpacked, opens and reads', async () => {
  await run();
  const listing = manifest().pack('barcode_us');
  expect(listing?.gzip).toBe(true);
  const unpacked = join(dir, 'unpacked.pack');
  writeFileSync(unpacked, gunzipSync(readFileSync(published())));
  const pack = await openPackFile(unpacked);
  expect((await pack.search('banana')).length).toBeGreaterThan(0);
  await pack.close();
});

it('a manifest base that is not https is refused', async () => {
  await expect(
    packagePacks({
      packs: join(dir, 'packs'),
      out: join(dir, 'publish'),
      baseUrl: new URL('http://insecure.example.test/'),
    }),
  ).rejects.toBeInstanceOf(ArgumentError);
});
