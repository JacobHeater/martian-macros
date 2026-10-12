import { describe, expect, it } from 'vitest';
import { Entitlement } from '../../src/domain/integration/Entitlement';
import type { EntitlementReader } from '../../src/domain/integration/EntitlementReader';
import { EntitlementStatus } from '../../src/domain/integration/EntitlementStatus';
import { first } from '../support/first';

/** What every `EntitlementReader` must do. */
export function entitlementReaderContract(name: string, create: () => EntitlementReader): void {
  describe(`${name} as an EntitlementReader`, () => {
    it('emits the current entitlement first', async () => {
      const current = await first(create().watchEntitlement());
      expect(EntitlementStatus.values).toContain(current.status);
    });

    it('coach is available exactly when not on the free tier', () => {
      expect(new Entitlement('free').coachAvailable).toBe(false);
      expect(new Entitlement('trial').coachAvailable).toBe(true);
      expect(new Entitlement('unlocked').coachAvailable).toBe(true);
    });
  });
}
