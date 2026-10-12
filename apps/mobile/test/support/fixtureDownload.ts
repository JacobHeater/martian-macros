import { InMemoryPackStore } from '../../src/foodCatalog/download/InMemoryPackStore';
import type { PackListing } from '../../src/foodCatalog/download/PackListing';
import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodPackFormat } from '../../src/foodCatalog/FoodPackFormat';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

export const packUrl = 'https://packs.example.test/barcode_us.pack.gz';

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function gzipped(bytes: Uint8Array): Promise<Uint8Array> {
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes as BufferSource);
      controller.close();
    },
  });
  const reader = source.pipeThrough(new CompressionStream('gzip')).getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    chunks.push(next.value);
    length += next.value.length;
  }
  const whole = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    whole.set(chunk, at);
    at += chunk.length;
  }
  return whole;
}

/** A store of packs held in memory, opening them with the same SQLite the tests use. */
export const memoryPackStore = () => new InMemoryPackStore((bytes) => WasmSqlDatabase.open({ bytes }));

/** A real pack (the fixture), gzip-compressed the way the host serves it, and the listing that offers it. */
export async function fixtureDownload({
  packId = 'barcode_us',
  version = '2026-10-09',
  sha,
}: { packId?: string; version?: string; sha?: string } = {}): Promise<{ gz: Uint8Array; listing: PackListing }> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(
    db,
    {
      packId,
      formatVersion: FoodPackFormat.version,
      builtOn: version,
      region: 'US',
      sources: ['test'],
      license: 'test',
      attribution: 'test',
    },
    FixturePack.entries,
  );
  const gz = await gzipped(await db.exportBytes());
  await db.close();
  return {
    gz,
    listing: {
      id: 'barcode_us',
      title: 'Barcode foods, United States',
      version,
      formatVersion: FoodPackFormat.version,
      url: new URL(packUrl),
      downloadBytes: gz.length,
      sha256: sha ?? (await sha256Hex(gz)),
      gzip: true,
    },
  };
}
