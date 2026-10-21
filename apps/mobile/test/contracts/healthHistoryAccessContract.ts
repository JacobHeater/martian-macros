import { beforeEach, describe, expect, it } from 'vitest';
import type { HealthHistoryAccess } from '../../src/healthIngest';

/**
 * What every `HealthHistoryAccess` must do (MM-73): the fake, the adapter
 * over the plugin and the platform that is not there. `create` gives one
 * in whatever state it starts in; the suite assumes no answer in
 * particular.
 */
export function healthHistoryAccessContract(name: string, create: () => Promise<HealthHistoryAccess>): void {
  describe(`${name} says whether history may be read`, () => {
    let access: HealthHistoryAccess;

    beforeEach(async () => {
      access = await create();
    });

    it('answers yes or no', async () => {
      expect(typeof (await access.historyPermitted())).toBe('boolean');
    });

    it('asking answers what is permitted afterwards', async () => {
      const answer = await access.requestHistory();
      expect(await access.historyPermitted()).toBe(answer);
    });

    it('asking again changes nothing', async () => {
      const once = await access.requestHistory();
      expect(await access.requestHistory()).toBe(once);
      expect(await access.historyPermitted()).toBe(once);
    });

    it('asking never takes a granted permission away', async () => {
      const before = await access.historyPermitted();
      const after = await access.requestHistory();
      if (before) expect(after).toBe(true);
    });
  });
}
