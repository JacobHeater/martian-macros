import { describe, expect, it } from 'vitest';
import { PackDownloadProgress } from '../../src/foodCatalog/download/PackDownloadProgress';
import { PackManifest } from '../../src/foodCatalog/download/PackManifest';
import { FormatError } from '../../src/lang/FormatError';

describe('manifest', () => {
  const sha = '0000000000000000000000000000000000000000000000000000000000000000';
  const json = ({ url = 'https://x.test/p.gz', hash = sha }: { url?: string; hash?: string } = {}) => `
{"packs":[{"id":"barcode_us","title":"Barcode foods","version":"2026-10-09",
"formatVersion":1,"url":"${url}","bytes":48000000,"sha256":"${hash}"}]}`;

  it('parses a listing', () => {
    const m = PackManifest.parse(json());
    expect(m.pack('barcode_us')?.downloadBytes).toBe(48000000);
    expect(m.pack('barcode_us')?.gzip).toBe(true);
    expect(m.pack('nope')).toBeUndefined();
  });

  it('refuses anything that is not plain https with a real checksum', () => {
    expect(() => PackManifest.parse(json({ url: 'http://x.test/p.gz' }))).toThrow(FormatError);
    expect(() => PackManifest.parse(json({ hash: 'abc' }))).toThrow(FormatError);
    expect(() => PackManifest.parse('{"nope":1}')).toThrow(FormatError);
    expect(() => PackManifest.parse('[]')).toThrow(FormatError);
  });

  // Added in the move: Dart's decoder threw these as a FormatException of its own.
  it('refuses text that is not JSON, and a URL that is not one', () => {
    expect(() => PackManifest.parse('not json')).toThrow(FormatError);
    expect(() => PackManifest.parse(json({ url: 'nowhere' }))).toThrow(FormatError);
  });
});

// Added in the move: the Dart download tests covered this through a download.
describe('progress', () => {
  it('is a fraction from 0 to 1, and 0 when the size is not known', () => {
    const at = (receivedBytes: number, totalBytes: number) =>
      new PackDownloadProgress({ phase: 'downloading', receivedBytes, totalBytes }).fraction;
    expect(at(25, 100)).toBe(0.25);
    expect(at(150, 100)).toBe(1);
    expect(at(10, 0)).toBe(0);
  });
});
