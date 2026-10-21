import { beforeEach, describe, expect, it } from 'vitest';
import { HealthDataType, type HealthBackfillMarks, type HealthSampleStore } from '../../src/healthIngest';

/**
 * What every `HealthBackfillMarks` must do (MM-73). Each one the app has is
 * kept beside a `HealthSampleStore`'s import tokens, so the suite also
 * holds that a mark and a token never touch each other.
 */
export function healthBackfillMarksContract(
  name: string,
  create: () => (HealthBackfillMarks & HealthSampleStore) | Promise<HealthBackfillMarks & HealthSampleStore>,
): void {
  describe(`${name} as HealthBackfillMarks`, () => {
    let marks: HealthBackfillMarks & HealthSampleStore;
    const march = new Date(2026, 2, 14, 9, 30, 15, 250);
    const may = new Date(2026, 4, 2, 23, 59, 59, 999);

    beforeEach(async () => {
      marks = await create();
    });

    it('starts with no mark for any type', async () => {
      for (const type of HealthDataType.values) expect(await marks.backfilledFrom(type)).toBeUndefined();
    });

    it('gives back the moment saved, to the millisecond', async () => {
      await marks.saveBackfilledFrom('weight', march);
      expect((await marks.backfilledFrom('weight'))?.getTime()).toBe(march.getTime());
    });

    it('a later save replaces the earlier one', async () => {
      await marks.saveBackfilledFrom('weight', may);
      await marks.saveBackfilledFrom('weight', march);
      expect((await marks.backfilledFrom('weight'))?.getTime()).toBe(march.getTime());
    });

    it('keeps each type apart', async () => {
      await marks.saveBackfilledFrom('weight', march);
      await marks.saveBackfilledFrom('bodyFat', may);
      expect((await marks.backfilledFrom('weight'))?.getTime()).toBe(march.getTime());
      expect((await marks.backfilledFrom('bodyFat'))?.getTime()).toBe(may.getTime());
      expect(await marks.backfilledFrom('leanMass')).toBeUndefined();
    });

    it('a mark and an import token never touch each other', async () => {
      await marks.saveToken('weight', 'token-1');
      await marks.saveBackfilledFrom('weight', march);
      expect(await marks.token('weight')).toBe('token-1');
      await marks.saveToken('weight', 'token-2');
      expect((await marks.backfilledFrom('weight'))?.getTime()).toBe(march.getTime());
      expect(await marks.token('bodyFat')).toBeUndefined();
    });
  });
}
