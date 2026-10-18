import { InMemoryPackHttp } from '../../foodCatalog/download/InMemoryPackHttp';
import { FixturePack } from '../../foodCatalog/FixturePack';
import { FoodPackFormat } from '../../foodCatalog/FoodPackFormat';
import { writeFoodPack } from '../../foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../sql/wasm/WasmSqlDatabase';
import type { StoryDevice } from './StoryDevice';

/** The packs the story's host lists, as the real one does (MM-384): the common foods and the barcode foods. */
const packs = [
  { id: 'generic', title: 'Common foods' },
  { id: 'barcode_us', title: 'Barcode foods, United States' },
] as const;

/**
 * The pack host as the story's phone reaches it (MM-56, MM-321, MM-384): a
 * manifest listing two packs, the fixture pack gzipped as the host serves
 * it under each id, all from memory. `stall` stops every download halfway
 * with the connection open, as a slow signal does; `corrupt` lists the
 * wrong checksums, so the downloads are thrown away; `checking` holds the
 * manifest itself; `down` answers every request with a server error.
 * `listed` is the version the host lists; `installed` puts that version of
 * the barcode pack on the phone before the story opens (MM-346); `only`
 * lists just that pack.
 */
export function storyPackHost({
  stall = false,
  corrupt = false,
  checking = false,
  down = false,
  listed = '2026-10-09',
  installed,
  only,
}: {
  /** Every pack stops halfway, or only the one named. */
  stall?: boolean | 'generic' | 'barcode_us';
  corrupt?: boolean;
  checking?: boolean;
  down?: boolean;
  listed?: string;
  installed?: string;
  only?: 'generic' | 'barcode_us';
} = {}): StoryDevice {
  return async (services) => {
    const files: [string, Uint8Array][] = [];
    const listings: string[] = [];
    for (const pack of packs.filter((p) => only === undefined || p.id === only)) {
      const db = await WasmSqlDatabase.open();
      await writeFoodPack(
        db,
        {
          packId: pack.id,
          formatVersion: FoodPackFormat.version,
          builtOn: '2026-10-09',
          region: 'US',
          sources: ['Invented test data'],
          license: 'Test data: no license applies.',
          attribution: 'None: invented for stories.',
        },
        FixturePack.entries,
      );
      const raw = await db.exportBytes();
      await db.close();
      const zipped = await gzip(raw);
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', zipped as BufferSource));
      const sha = corrupt ? 'c'.repeat(64) : [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      const packUrl = `https://packs.example.test/${pack.id}.pack.gz`;
      files.push([packUrl, zipped]);
      listings.push(
        `{"id":"${pack.id}","title":"${pack.title}","version":"${listed}","formatVersion":${FoodPackFormat.version},"url":"${packUrl}","bytes":${zipped.length},"sha256":"${sha}"}`,
      );
    }
    const manifestUrl = 'https://packs.example.test/manifest.json';
    const manifest = new TextEncoder().encode(`{"packs":[${listings.join(',')}]}`);
    const http = new InMemoryPackHttp([[manifestUrl, manifest], ...files], { chunkSize: 1024 });
    if (down) http.failWithStatus = 503;
    else if (checking) http.stallAfterBytes = 0;
    else if (stall !== false) {
      // The manifest comes back whole; every pack (or the one named) stops halfway.
      for (const [at, zipped] of files) {
        if (stall === true || at.endsWith(`/${stall}.pack.gz`)) http.stallAt.set(at, Math.floor(zipped.length / 2));
      }
    }
    if (installed !== undefined) {
      const zipped = files.find(([at]) => at.endsWith('barcode_us.pack.gz'))?.[1] as Uint8Array;
      const partial = await services.packStore.writePartial('barcode_us', installed, { append: false });
      await partial.write(zipped);
      await partial.close();
      await (await services.packStore.stage('barcode_us', installed, { gzip: true })).close();
      await services.packStore.commit('barcode_us', installed, { title: 'Barcode foods, United States' });
    }
    return { ...services, packHttp: http, packManifestUrl: manifestUrl };
  };
}

async function gzip(raw: Uint8Array): Promise<Uint8Array> {
  const source = new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(raw as BufferSource);
      controller.close();
    },
  });
  const reader = source.pipeThrough(new CompressionStream('gzip')).getReader();
  const chunks: Uint8Array[] = [];
  for (let next = await reader.read(); !next.done; next = await reader.read()) chunks.push(next.value);
  const zipped = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let at = 0;
  for (const chunk of chunks) {
    zipped.set(chunk, at);
    at += chunk.length;
  }
  return zipped;
}
