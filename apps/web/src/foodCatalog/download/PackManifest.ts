import { FormatError } from '../../lang/FormatError';
import type { PackListing } from './PackListing';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function listing(item: unknown): PackListing {
  if (!isRecord(item)) throw new FormatError('A pack entry is not an object.');
  const textOf = (key: string): string => {
    const v = item[key];
    if (typeof v !== 'string') throw new FormatError(`A pack entry needs "${key}".`);
    return v;
  };
  const wholeNumberOf = (key: string): number => {
    const v = item[key];
    if (typeof v !== 'number' || !Number.isInteger(v)) throw new FormatError(`A pack entry needs "${key}".`);
    return v;
  };
  let url: URL;
  try {
    url = new URL(textOf('url'));
  } catch {
    throw new FormatError(`Pack URLs must be https: ${textOf('url')}`);
  }
  if (url.protocol !== 'https:') throw new FormatError(`Pack URLs must be https: ${url.href}`);
  const sha = textOf('sha256').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sha)) throw new FormatError('A pack entry needs a 64-digit sha256.');
  const gzip = item['gzip'];
  return {
    id: textOf('id'),
    title: textOf('title'),
    version: textOf('version'),
    formatVersion: wholeNumberOf('formatVersion'),
    url,
    downloadBytes: wholeNumberOf('bytes'),
    sha256: sha,
    gzip: typeof gzip === 'boolean' ? gzip : true,
  };
}

/**
 * The small file that lists the packs available to download.
 *
 * ```json
 * {"packs": [{"id": "barcode_us", "title": "...", "version": "2026-10-09",
 *   "formatVersion": 1, "url": "https://...", "bytes": 48000000,
 *   "sha256": "...", "gzip": true}]}
 * ```
 */
export class PackManifest {
  readonly packs: readonly PackListing[];

  constructor(packs: readonly PackListing[]) {
    this.packs = packs;
  }

  /**
   * Throws `FormatError` for a manifest that is not well formed, so a
   * broken file is reported and never half-read.
   */
  static parse(json: string): PackManifest {
    let decoded: unknown;
    try {
      decoded = JSON.parse(json);
    } catch {
      throw new FormatError('The manifest is not JSON.');
    }
    if (!isRecord(decoded) || !Array.isArray(decoded['packs'])) {
      throw new FormatError('The manifest has no "packs" list.');
    }
    return new PackManifest((decoded['packs'] as unknown[]).map(listing));
  }

  pack(id: string): PackListing | undefined {
    return this.packs.find((p) => p.id === id);
  }
}
