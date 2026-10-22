import { describe, expect, it } from 'vitest';
import type { DeviceLock } from '../../src/domain/integration/DeviceLock';
import { DeviceLockOutcome } from '../../src/domain/integration/DeviceLockOutcome';

/**
 * What every `DeviceLock` must do (MM-157): answer one of the outcomes,
 * never throw (a lock that cannot be asked is an answer, not a failure),
 * and answer each asking, however often asked. `expected` is the answer
 * this one is set up to give.
 */
export function deviceLockContract(name: string, create: () => DeviceLock, expected: DeviceLockOutcome): void {
  describe(`${name} as DeviceLock`, () => {
    it(`answers "${expected}", one of the outcomes`, async () => {
      const outcome = await create().unlock('Unlock to see your progress photos.');
      expect(DeviceLockOutcome.values).toContain(outcome);
      expect(outcome).toBe(expected);
    });

    it('answers every asking, and never throws', async () => {
      const lock = create();
      const outcomes = await Promise.all([lock.unlock('First'), lock.unlock('Second')]);
      expect(outcomes).toEqual([expected, expected]);
    });
  });
}
