import { beforeEach, describe, expect, it } from 'vitest';
import type { BackupStorage } from '../../src/domain/integration/BackupStorage';
import { NotFound } from '../../src/domain/integration/NotFound';
import type { Outcome } from '../../src/domain/integration/Outcome';
import { Succeeded } from '../../src/domain/integration/Succeeded';

const bytes = (values: number[]) => Uint8Array.from(values);

function valueOf<T>(outcome: Outcome<T>): T {
  if (!(outcome instanceof Succeeded)) throw new Error(`Expected a success, got ${outcome.kind}.`);
  return outcome.value;
}

/** What every `BackupStorage` must do. */
export function backupStorageContract(name: string, create: () => BackupStorage | Promise<BackupStorage>): void {
  describe(`${name} as a BackupStorage`, () => {
    let storage: BackupStorage;
    beforeEach(async () => {
      storage = await create();
    });

    const names = async () => valueOf(await storage.list());

    it('starts empty', async () => {
      expect(await names()).toEqual([]);
    });

    it('returns what was stored, byte for byte', async () => {
      expect(await storage.put('a.bin', bytes([1, 2, 3]))).toBeInstanceOf(Succeeded);
      expect([...valueOf(await storage.get('a.bin'))]).toEqual([1, 2, 3]);
    });

    it('storing under an existing name replaces it', async () => {
      await storage.put('a.bin', bytes([1]));
      await storage.put('a.bin', bytes([9, 9]));
      expect([...valueOf(await storage.get('a.bin'))]).toEqual([9, 9]);
      expect(await names()).toEqual(['a.bin']);
    });

    it('lists names sorted', async () => {
      await storage.put('b.bin', bytes([1]));
      await storage.put('a.bin', bytes([1]));
      expect(await names()).toEqual(['a.bin', 'b.bin']);
    });

    it('a missing blob is NotFound, not an error', async () => {
      expect(await storage.get('nope')).toBeInstanceOf(NotFound);
    });

    it('delete removes a blob; deleting a missing one succeeds', async () => {
      await storage.put('a.bin', bytes([1]));
      expect(await storage.delete('a.bin')).toBeInstanceOf(Succeeded);
      expect(await storage.delete('a.bin')).toBeInstanceOf(Succeeded);
      expect(await names()).toEqual([]);
    });

    it('a stored blob is not changed by changing the original', async () => {
      const original = bytes([1, 2, 3]);
      await storage.put('a.bin', original);
      original[0] = 99;
      expect([...valueOf(await storage.get('a.bin'))]).toEqual([1, 2, 3]);
    });
  });
}
