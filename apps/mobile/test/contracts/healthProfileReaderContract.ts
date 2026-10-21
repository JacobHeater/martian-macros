import { beforeEach, describe, expect, it } from 'vitest';
import { BiologicalSex } from '../../src/domain/BiologicalSex';
import type { HealthProfileReader } from '../../src/domain/integration/HealthProfileReader';

/**
 * What every `HealthProfileReader` must do (MM-69). `create` gives a reader
 * holding whatever it holds; the suite assumes nothing in particular.
 */
export function healthProfileReaderContract(name: string, create: () => Promise<HealthProfileReader>): void {
  describe(`${name} reads a health profile`, () => {
    let reader: HealthProfileReader;

    beforeEach(async () => {
      reader = await create();
    });

    it('answers only a sex the app uses, a real day, and a positive height', async () => {
      const profile = await reader.readProfile();
      if (profile.sex !== undefined) expect(BiologicalSex.values).toContain(profile.sex);
      if (profile.birthDate !== undefined) expect(Number.isInteger(profile.birthDate.epochDay)).toBe(true);
      if (profile.heightCm !== undefined) {
        expect(Number.isFinite(profile.heightCm)).toBe(true);
        expect(profile.heightCm).toBeGreaterThan(0);
      }
    });

    it('answers the same when asked again', async () => {
      expect(await reader.readProfile()).toEqual(await reader.readProfile());
    });

    it('a reader that offers nothing reads nothing', async () => {
      if (reader.offersProfile) return;
      expect(await reader.readProfile()).toEqual({ sex: undefined, birthDate: undefined, heightCm: undefined });
    });
  });
}
