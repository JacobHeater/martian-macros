import { beforeEach, describe, expect, it } from 'vitest';
import { HealthDataType, type HealthSample, type HealthSource } from '../../src/healthIngest';

/**
 * What every `HealthSource` must do (MM-67): the fake on any machine and,
 * on a device, each real platform. `create` gives a source the app has
 * permission to read, with whatever readings it happens to hold; the
 * suite assumes none in particular.
 */
export function healthSourceContract(name: string, create: () => Promise<HealthSource>): void {
  describe(`${name} is a health source`, () => {
    let source: HealthSource;
    const longAgo = new Date(2000, 0, 1);
    const farAhead = new Date(2100, 0, 1);
    const everything = { from: longAgo, to: farAhead };

    beforeEach(async () => {
      source = await create();
    });

    it('what is permitted is within what is available', async () => {
      const available = await source.available();
      for (const type of await source.permitted()) expect(available).toContain(type);
    });

    it('asking for a type that is not available does not permit it', async () => {
      const available = await source.available();
      const missing = new Set(HealthDataType.values.filter((type) => !available.has(type)));
      const after = await source.requestPermission(missing);
      expect([...after].filter((type) => missing.has(type))).toEqual([]);
    });

    it('readings come oldest first, within the range, of the type asked for, each with an id of its own and a source', async () => {
      for (const type of await source.permitted()) {
        const samples = await source.read(type, everything);
        expect(new Set(samples.map((s) => s.platformId)).size).toBe(samples.length);
        samples.forEach((sample, i) => {
          expect(sample.type).toBe(type);
          expect(sample.platformId).not.toBe('');
          expect(sample.sourceId).not.toBe('');
          expect(sample.start.getTime()).toBeGreaterThanOrEqual(longAgo.getTime());
          expect(sample.start.getTime()).toBeLessThan(farAhead.getTime());
          const before = samples[i - 1];
          if (before !== undefined) {
            expect(sample.start.getTime()).toBeGreaterThanOrEqual(before.start.getTime());
          }
        });
      }
    });

    it('the end of a range is not in it, and an empty range is empty', async () => {
      for (const type of await source.permitted()) {
        const all = await source.read(type, everything);
        const earliest: HealthSample | undefined = all[0];
        if (earliest === undefined) continue;
        const first = earliest.start;
        expect(await source.read(type, { from: longAgo, to: first })).toEqual([]);
        expect((await source.read(type, { from: first, to: farAhead }))[0]).toEqual(earliest);
        expect(await source.read(type, { from: first, to: first })).toEqual([]);
      }
    });

    it('a type that is not permitted reads as nothing', async () => {
      const permitted = await source.permitted();
      for (const type of HealthDataType.values) {
        if (permitted.has(type)) continue;
        expect(await source.read(type, everything)).toEqual([]);
        expect((await source.changesSince(type, undefined)).upserted).toEqual([]);
      }
    });

    it('with no token, the changes are everything, and come with a token', async () => {
      for (const type of await source.permitted()) {
        const changes = await source.changesSince(type, undefined);
        expect(changes.tokenExpired).toBe(false);
        expect(changes.nextToken).not.toBe('');
        expect(changes.deletedIds).toEqual([]);
        expect(new Set(changes.upserted.map((s) => s.platformId))).toEqual(
          new Set((await source.read(type, everything)).map((s) => s.platformId)),
        );
      }
    });

    it('asked again at once, nothing has changed', async () => {
      for (const type of await source.permitted()) {
        const first = await source.changesSince(type, undefined);
        const again = await source.changesSince(type, first.nextToken);
        expect(again.tokenExpired).toBe(false);
        expect(again.upserted).toEqual([]);
        expect(again.deletedIds).toEqual([]);
      }
    });

    it('a token that was never issued is expired, not an error', async () => {
      for (const type of await source.permitted()) {
        const changes = await source.changesSince(type, 'not a token');
        expect(changes.tokenExpired).toBe(true);
        expect(changes.upserted).toEqual([]);
      }
    });
  });
}
