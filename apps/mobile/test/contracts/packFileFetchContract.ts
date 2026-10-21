import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPackHttp } from '../../src/foodCatalog/download/InMemoryPackHttp';
import { InMemoryPackStore } from '../../src/foodCatalog/download/InMemoryPackStore';
import type { PackFileFetch } from '../../src/foodCatalog/download/PackFileFetch';
import type { PackFileTransfer } from '../../src/foodCatalog/download/PackFileTransfer';
import type { PackHttp } from '../../src/foodCatalog/download/PackHttp';
import type { PackStore } from '../../src/foodCatalog/download/PackStore';
import { PackWriteFailed } from '../../src/foodCatalog/download/PackWriteFailed';
import { sha256Hex } from '../support/fixtureDownload';

const url = new URL('https://packs.example.test/a.pack.gz');
const id = 'a';
const version = '2026-10-21';
/** A file of five chunks, its bytes telling their place. */
const file = Uint8Array.from({ length: 5000 }, (_, at) => at % 251);

const counts = async (transfer: PackFileTransfer): Promise<number[]> => {
  const told: number[] = [];
  for await (const count of transfer.written) told.push(count);
  return told;
};

/**
 * What every `PackFileFetch` must do (MM-387). `create` builds one over the
 * network `http` and the partials of `store`, which the contract supplies:
 * the bytes come from the one and land in the other, however they travel.
 */
export function packFileFetchContract(name: string, create: (seam: { http: PackHttp; store: PackStore }) => PackFileFetch): void {
  describe(`${name} as a PackFileFetch`, () => {
    let http: InMemoryPackHttp;
    let store: InMemoryPackStore;
    let fileSha: string;

    beforeEach(async () => {
      http = new InMemoryPackHttp([[url.toString(), file]], { chunkSize: 1000 });
      store = new InMemoryPackStore(() => Promise.reject(new Error('Nothing is opened here.')));
      fileSha = await sha256Hex(file);
    });

    const keep = async (bytes: Uint8Array) => {
      const partial = await store.writePartial(id, version, { append: false });
      await partial.write(bytes);
      await partial.close();
    };

    it('writes the whole file from nothing, counting up to its length', async () => {
      const transfer = await create({ http, store }).fetchInto({ url, id, version });
      expect(transfer.statusCode).toBe(200);
      const told = await counts(transfer);
      expect(told.at(-1)).toBe(file.length);
      expect([...told].sort((a, b) => a - b)).toEqual(told);
      expect(await store.partialSha256(id, version)).toBe(fileSha);
    });

    it('carries on at the offset when the server honours the range', async () => {
      await keep(file.subarray(0, 2000));
      const transfer = await create({ http, store }).fetchInto({ url, id, version, rangeStart: 2000 });
      expect(transfer.statusCode).toBe(206);
      expect((await counts(transfer)).at(-1)).toBe(3000);
      expect(await store.partialSha256(id, version)).toBe(fileSha);
    });

    it('begins again when the server ignores the range', async () => {
      http.supportsRange = false;
      await keep(new Uint8Array(2000).fill(7));
      const transfer = await create({ http, store }).fetchInto({ url, id, version, rangeStart: 2000 });
      expect(transfer.statusCode).toBe(200);
      expect((await counts(transfer)).at(-1)).toBe(file.length);
      expect(await store.partialBytes(id, version)).toBe(file.length);
      expect(await store.partialSha256(id, version)).toBe(fileSha);
    });

    it('writes nothing for a request the server refuses', async () => {
      http.failWithStatus = 404;
      const transfer = await create({ http, store }).fetchInto({ url, id, version });
      expect(transfer.statusCode).toBe(404);
      expect(await counts(transfer)).toEqual([]);
      transfer.abort();
      expect(await store.partialBytes(id, version)).toBe(0);
    });

    it('a dropped connection fails the count, and what was counted stays for a resume', async () => {
      http.dropAfterBytes = 2500;
      const transfer = await create({ http, store }).fetchInto({ url, id, version });
      const told: number[] = [];
      const reading = (async () => {
        for await (const count of transfer.written) told.push(count);
      })();
      const error = await reading.then(
        () => undefined,
        (thrown: unknown) => thrown,
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(PackWriteFailed);
      expect(await store.partialBytes(id, version)).toBeGreaterThanOrEqual(told.at(-1) ?? 0);
      expect(await store.partialBytes(id, version)).toBeLessThanOrEqual(2500);
    });

    it('a file that cannot be written fails the count with PackWriteFailed', async () => {
      const full: PackStore = Object.assign(Object.create(store) as InMemoryPackStore, {
        writePartial: () =>
          Promise.resolve({ write: () => Promise.reject(new Error('No space left on device')), close: () => Promise.resolve() }),
      });
      const transfer = await create({ http, store: full }).fetchInto({ url, id, version });
      await expect(counts(transfer)).rejects.toBeInstanceOf(PackWriteFailed);
    });

    it('abort ends a transfer that has stalled, and what was written stays', async () => {
      http.stallAfterBytes = 2000;
      const transfer = await create({ http, store }).fetchInto({ url, id, version });
      const told = transfer.written[Symbol.asyncIterator]();
      let count = 0;
      while (count < 2000) {
        const next = await told.next();
        if (next.done === true) break;
        count = next.value;
      }
      expect(count).toBe(2000);
      const waiting = told.next().then(
        () => 'ended',
        () => 'ended',
      );
      transfer.abort();
      expect(await waiting).toBe('ended');
      await told.return?.();
      expect(await store.partialBytes(id, version)).toBe(2000);
    });
  });
}
