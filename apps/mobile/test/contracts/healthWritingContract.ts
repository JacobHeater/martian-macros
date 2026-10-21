import { beforeEach, describe, expect, it } from 'vitest';
import { HealthWriteKind } from '../../src/healthIngest/HealthWriteKind';
import type { HealthWriting } from '../../src/healthIngest/HealthWriting';

/**
 * What every `HealthWriting` must do (MM-70, MM-314, MM-489). `create`
 * gives one with every kind off: each kind is turned on by itself, with a
 * permission of its own, and the user may refuse it.
 */
export function healthWritingContract(name: string, create: () => Promise<HealthWriting>): void {
  describe(`${name} as HealthWriting`, () => {
    let writing: HealthWriting;

    beforeEach(async () => {
      writing = await create();
    });

    it('every kind is off at first', async () => {
      expect(await writing.writing()).toEqual(new Set());
    });

    it('turning a kind on answers whether it is on, and turns on no other', async () => {
      for (const kind of HealthWriteKind.values) {
        const before = await writing.writing();
        const on = await writing.startWriting(kind);
        const after = await writing.writing();
        expect(after.has(kind)).toBe(on);
        for (const other of HealthWriteKind.values) {
          if (other !== kind) expect(after.has(other)).toBe(before.has(other));
        }
      }
    });

    it('a kind turned off is off, and the others stay as they were', async () => {
      for (const kind of HealthWriteKind.values) await writing.startWriting(kind);
      const before = await writing.writing();
      await writing.stopWriting('food');
      const after = await writing.writing();
      expect(after.has('food')).toBe(false);
      expect(after.has('water')).toBe(before.has('water'));
      expect(after.has('workouts')).toBe(before.has('workouts'));
    });

    it('turning off a kind that is off changes nothing', async () => {
      await writing.stopWriting('water');
      expect(await writing.writing()).toEqual(new Set());
    });
  });
}
