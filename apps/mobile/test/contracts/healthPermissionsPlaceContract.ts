import { beforeEach, describe, expect, it } from 'vitest';
import type { HealthPermissionsPlace, HealthSource } from '../../src/healthIngest';

/**
 * What every `HealthPermissionsPlace` must do (MM-323): the fake, the
 * adapter over the plugin and the platform that is not there. `create`
 * gives one in whatever state it starts in; the suite assumes no answer in
 * particular.
 */
export function healthPermissionsPlaceContract(
  name: string,
  create: () => Promise<HealthSource & HealthPermissionsPlace>,
): void {
  describe(`${name} says where to allow what it no longer asks about`, () => {
    let place: HealthSource & HealthPermissionsPlace;

    beforeEach(async () => {
      place = await create();
    });

    it('has stopped asking about nothing before anything is asked for', async () => {
      for (const type of await place.available()) expect(await place.stoppedAsking(type)).toBe(false);
    });

    it('a kind permitted after asking is never one it stopped asking about', async () => {
      const here = await place.available();
      const after = await place.requestPermission(here);
      for (const type of after) expect(await place.stoppedAsking(type)).toBe(false);
    });

    it('opening its screen answers yes or no, and changes nothing permitted', async () => {
      const before = await place.permitted();
      expect(typeof (await place.openPermissions())).toBe('boolean');
      expect(await place.permitted()).toEqual(before);
    });
  });
}
