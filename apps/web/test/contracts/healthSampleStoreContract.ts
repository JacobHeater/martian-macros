import { beforeEach, describe, expect, it } from 'vitest';
import { HealthDataType, type HealthSample, type HealthSampleStore } from '../../src/healthIngest';

/** What every `HealthSampleStore` must do (MM-67). */
export function healthSampleStoreContract(name: string, create: () => HealthSampleStore): void {
  describe(`${name} as a HealthSampleStore`, () => {
    let store: HealthSampleStore;

    const weight = (
      id: string,
      kg: number,
      { day = 1, source = 'scale' }: { day?: number; source?: string } = {},
    ): HealthSample => ({
      platformId: id,
      type: 'weight',
      value: kg,
      start: new Date(2026, 8, day, 7, 2, 30),
      sourceId: source,
      sourceName: 'Bathroom scale',
    });

    const fat: HealthSample = {
      platformId: 'w-1',
      type: 'bodyFat',
      value: 21.4,
      start: new Date(2026, 8, 1, 7, 2),
      sourceId: 'scale',
      sourceName: 'Bathroom scale',
    };

    beforeEach(() => {
      store = create();
    });

    it('starts empty, with no token', async () => {
      for (const type of HealthDataType.values) {
        expect(await store.samples(type)).toEqual([]);
        expect(await store.token(type)).toBeUndefined();
      }
    });

    it('a reading is read back with every field', async () => {
      const workout: HealthSample = {
        platformId: 'x-1',
        type: 'workout',
        value: 55,
        start: new Date(2026, 8, 2, 18),
        end: new Date(2026, 8, 2, 18, 55),
        sourceId: 'com.example.watch',
        sourceName: 'Watch',
      };
      await store.upsert([weight('w-1', 82.6), workout]);
      expect(await store.samples('weight')).toEqual([weight('w-1', 82.6)]);
      expect(await store.samples('workout')).toEqual([workout]);
    });

    it('readings come oldest first', async () => {
      await store.upsert([weight('b', 82, { day: 3 }), weight('a', 83, { day: 1 }), weight('c', 81, { day: 2 })]);
      expect((await store.samples('weight')).map((s) => s.platformId)).toEqual(['a', 'c', 'b']);
    });

    it('the same platform id again replaces the reading', async () => {
      await store.upsert([weight('w-1', 82.6)]);
      await store.upsert([weight('w-1', 82.4, { day: 2 })]);
      expect(await store.samples('weight')).toEqual([weight('w-1', 82.4, { day: 2 })]);
    });

    it('the same id under another type is another reading', async () => {
      await store.upsert([weight('w-1', 82.6), fat]);
      expect(await store.samples('weight')).toHaveLength(1);
      expect(await store.samples('bodyFat')).toEqual([fat]);
    });

    it('delete removes the ids given, of that type only, and ignores ids it does not have', async () => {
      await store.upsert([weight('w-1', 82.6), weight('w-2', 82.3), fat]);
      await store.delete('weight', ['w-1', 'never-stored']);
      expect(await store.samples('weight')).toEqual([weight('w-2', 82.3)]);
      expect(await store.samples('bodyFat')).toEqual([fat]);
      await store.delete('weight', []);
      expect(await store.samples('weight')).toHaveLength(1);
    });

    it('replace leaves exactly what it is given, for that type', async () => {
      const steps: HealthSample = {
        platformId: 's-1',
        type: 'steps',
        value: 8421,
        start: new Date(2026, 8, 2),
        end: new Date(2026, 8, 3),
        sourceId: 'watch',
        sourceName: 'Watch',
      };
      await store.upsert([weight('w-1', 82.6), weight('w-2', 82.3), steps]);
      await store.replace('weight', [weight('w-2', 82.2), weight('w-3', 82.0, { day: 4 })]);
      expect(await store.samples('weight')).toEqual([weight('w-2', 82.2), weight('w-3', 82.0, { day: 4 })]);
      expect(await store.samples('steps')).toEqual([steps]);
      await store.replace('weight', []);
      expect(await store.samples('weight')).toEqual([]);
    });

    it('a token is kept per type, and the latest wins', async () => {
      await store.saveToken('weight', 'a');
      await store.saveToken('steps', 'b');
      await store.saveToken('weight', 'c');
      expect(await store.token('weight')).toBe('c');
      expect(await store.token('steps')).toBe('b');
      expect(await store.token('height')).toBeUndefined();
    });
  });
}
