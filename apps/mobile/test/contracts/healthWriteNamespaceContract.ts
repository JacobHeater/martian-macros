import { describe, expect, it } from 'vitest';
import type { HealthWriteNamespace } from '../../src/healthIngest/HealthWriteNamespace';

/**
 * What every `HealthWriteNamespace` must do (MM-522): one namespace, the
 * same until renewed, and after each renewal one never given before, so
 * nothing written after an erase shares an id with what was written before.
 */
export function healthWriteNamespaceContract(name: string, create: () => Promise<HealthWriteNamespace>): void {
  describe(`${name} as HealthWriteNamespace`, () => {
    it('is never empty, and the same on every call until renewed', async () => {
      const ids = await create();
      const first = await ids.writeNamespace();
      expect(first).not.toBe('');
      expect(await ids.writeNamespace()).toBe(first);
    });

    it('each renewal gives one never given before', async () => {
      const ids = await create();
      const seen = new Set([await ids.writeNamespace()]);
      for (let i = 0; i < 3; i++) {
        await ids.renewWriteNamespace();
        const next = await ids.writeNamespace();
        expect(seen.has(next)).toBe(false);
        seen.add(next);
      }
    });
  });
}
