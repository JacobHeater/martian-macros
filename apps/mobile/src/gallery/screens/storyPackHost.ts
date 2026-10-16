import { InMemoryPackHttp } from '../../foodCatalog/download/InMemoryPackHttp';
import { FixturePack } from '../../foodCatalog/FixturePack';
import { FoodPackFormat } from '../../foodCatalog/FoodPackFormat';
import { writeFoodPack } from '../../foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../sql/wasm/WasmSqlDatabase';
import type { StoryDevice } from './StoryDevice';

/**
 * The pack host as the story's phone reaches it (MM-56, MM-321): a manifest
 * listing one pack, the fixture pack gzipped as the host serves it, all from
 * memory. `stall` stops the download halfway with the connection open, as a
 * slow signal does; `corrupt` lists the wrong checksum, so the download is
 * thrown away; `checking` holds the manifest itself; `down` answers every
 * request with a server error. `listed` is the version the host lists;
 * `installed` puts that version of the pack on the phone before the story
 * opens (MM-346).
 */
export function storyPackHost({
  stall = false,
  corrupt = false,
  checking = false,
  down = false,
  listed = '2026-10-09',
  installed,
}: {
  stall?: boolean;
  corrupt?: boolean;
  checking?: boolean;
  down?: boolean;
  listed?: string;
  installed?: string;
} = {}): StoryDevice {
  return async (services) => {
    const db = await WasmSqlDatabase.open();
    await writeFoodPack(
      db,
      {
        packId: 'barcode_us',
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
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', zipped as BufferSource));
    const sha = corrupt ? 'c'.repeat(64) : [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const manifestUrl = 'https://packs.example.test/manifest.json';
    const packUrl = 'https://packs.example.test/barcode_us.pack.gz';
    const manifest = new TextEncoder().encode(
      '{"packs":[{"id":"barcode_us","title":"Barcode foods, United States","version":"' +
        listed +
        '",' +
        `"formatVersion":${FoodPackFormat.version},"url":"${packUrl}","bytes":${zipped.length},"sha256":"${sha}"}]}`,
    );
    const http = new InMemoryPackHttp(
      [
        [manifestUrl, manifest],
        [packUrl, zipped],
      ],
      { chunkSize: 1024 },
    );
    if (down) http.failWithStatus = 503;
    else if (checking) http.stallAfterBytes = 0;
    else if (stall) {
      // The manifest comes back whole; the pack stops halfway.
      const get = http.get.bind(http);
      http.get = (url, options) => {
        if (url.toString() === packUrl) http.stallAfterBytes = Math.floor(zipped.length / 2);
        return get(url, options);
      };
    }
    if (installed !== undefined) {
      const partial = await services.packStore.writePartial('barcode_us', installed, { append: false });
      await partial.write(zipped);
      await partial.close();
      await (await services.packStore.stage('barcode_us', installed, { gzip: true })).close();
      await services.packStore.commit('barcode_us', installed, { title: 'Barcode foods, United States' });
    }
    return { ...services, packHttp: http, packManifestUrl: manifestUrl };
  };
}
