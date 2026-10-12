import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ArgumentError } from '../../lang/ArgumentError';
import { compareStrings } from '../../lang/compareStrings';
import { openPackFile } from './openPackFile';

/** What the app tells the user each pack is. */
const titles: Readonly<Record<string, string>> = {
  generic: 'Common foods',
  barcode_us: 'Barcode foods, United States',
};

/**
 * Prepares built packs for publishing (MM-56): gzip-compresses each
 * `*.pack` in the folder `packs` into the folder `out`, and writes
 * `manifest.json` listing each with its size and SHA-256, served from
 * `baseUrl`.
 *
 * Publishing is a separate, deliberate step: nothing is uploaded here. Do
 * not publish before the licensing has been reviewed (MM-57).
 */
export async function packagePacks({ packs, out, baseUrl }: { packs: string; out: string; baseUrl: URL }): Promise<void> {
  if (baseUrl.protocol !== 'https:') throw new ArgumentError(`The base URL must be https: ${baseUrl.href}`);
  mkdirSync(out, { recursive: true });
  const entries: Record<string, unknown>[] = [];
  const files = readdirSync(packs)
    .filter((name) => name.endsWith('.pack') && statSync(join(packs, name)).isFile())
    .sort(compareStrings);
  for (const file of files) {
    const pack = await openPackFile(join(packs, file));
    const header = pack.header;
    await pack.close();
    const name = `${header.packId}-${header.builtOn}.pack.gz`;
    // Fixed level and no timestamp in the stream, so the same pack gives
    // the same bytes and the same checksum.
    const compressed = gzipSync(readFileSync(join(packs, file)), { level: 9 });
    writeFileSync(join(out, name), compressed);
    entries.push({
      id: header.packId,
      title: titles[header.packId] ?? header.packId,
      version: header.builtOn,
      formatVersion: header.formatVersion,
      url: new URL(name, baseUrl).href,
      bytes: compressed.length,
      sha256: createHash('sha256').update(compressed).digest('hex'),
      gzip: true,
    });
  }
  writeFileSync(join(out, 'manifest.json'), JSON.stringify({ packs: entries }, null, 2));
}
