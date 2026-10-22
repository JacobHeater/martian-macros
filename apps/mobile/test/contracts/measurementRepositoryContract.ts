import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { MeasurementRepository } from '../../src/domain/repositories/MeasurementRepository';
import { WaistFromMeasurements } from '../../src/domain/measurements/WaistFromMeasurements';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `MeasurementRepository` must do (MM-156), in memory and in the database. */
export function measurementRepositoryContract(
  name: string,
  create: () => MeasurementRepository | Promise<MeasurementRepository>,
): void {
  describe(`${name} as a MeasurementRepository`, () => {
    let repo: MeasurementRepository;
    const d1 = CalendarDate.of(2026, 1, 1);
    const d2 = CalendarDate.of(2026, 1, 8);
    beforeEach(async () => {
      repo = await create();
    });

    it('starts empty', async () => {
      expect(await first(repo.watchMeasurements())).toEqual([]);
      expect(await first(repo.watchSite('neck'))).toEqual([]);
    });

    it('keeps each site apart, one per day, oldest first, a day replaced', async () => {
      await repo.saveMeasurement('thigh', d2, 58);
      await repo.saveMeasurement('hips', d1, 101, { readings: [100.5, 101.5, 101] });
      await repo.saveMeasurement('hips', d2, 100.5);
      await repo.saveMeasurement('hips', d2, 100);
      const hips = await first(repo.watchSite('hips'));
      expect(hips.map((o) => [o.date.epochDay, o.valueCm])).toEqual([
        [d1.epochDay, 101],
        [d2.epochDay, 100],
      ]);
      expect(hips[0]?.readings).toEqual([100.5, 101.5, 101]);
      expect(hips[1]?.readings).toEqual([]);
      expect((await first(repo.watchSite('thigh'))).map((o) => o.valueCm)).toEqual([58]);
    });

    it('lists every site by day, then in the sites’ fixed order', async () => {
      await repo.saveMeasurement('calf', d1, 38);
      await repo.saveMeasurement('waist', d2, 90);
      await repo.saveMeasurement('neck', d1, 37);
      await repo.saveMeasurement('waist', d1, 91);
      expect((await first(repo.watchMeasurements())).map((o) => `${o.date.epochDay}/${o.site}`)).toEqual([
        `${d1.epochDay}/waist`,
        `${d1.epochDay}/neck`,
        `${d1.epochDay}/calf`,
        `${d2.epochDay}/waist`,
      ]);
    });

    it('a single reading is said to be one', async () => {
      await repo.saveMeasurement('upperArm', d1, 34, { readings: [34] });
      const [arm] = await first(repo.watchSite('upperArm'));
      expect(arm?.isSingleReading).toBe(true);
    });

    it('refuses a value no site can have', async () => {
      await expect(repo.saveMeasurement('neck', d1, 5)).rejects.toBeDefined();
      expect(await first(repo.watchSite('neck'))).toEqual([]);
    });

    it('the waist is the waist site: what one saves the other reads', async () => {
      const waist = new WaistFromMeasurements(repo);
      await waist.saveWaist(d1, 92, { readings: [91.5, 92.5, 92] });
      await repo.saveMeasurement('waist', d2, 90.5, { readings: [90.5] });
      const read = await first(waist.watchWaist());
      expect(read.map((w) => [w.date.epochDay, w.waistCm])).toEqual([
        [d1.epochDay, 92],
        [d2.epochDay, 90.5],
      ]);
      expect(read[0]?.readings).toEqual([91.5, 92.5, 92]);
      expect((await first(repo.watchSite('waist'))).length).toBe(2);
    });

    it('emits the current list first, then each change', async () => {
      await expectChangeEmits(repo.watchSite('chest'), {
        see: (l) => l.length,
        before: 0,
        change: () => repo.saveMeasurement('chest', d1, 104),
        after: 1,
      });
    });
  });
}
