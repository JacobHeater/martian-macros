import { beforeEach, describe, expect, it } from 'vitest';
import { MeasurementSettings } from '../../src/domain/measurements/MeasurementSettings';
import type { MeasurementSettingsRepository } from '../../src/domain/repositories/MeasurementSettingsRepository';
import { expectChangeEmits } from '../support/expectChangeEmits';
import { first } from '../support/first';

/** What every `MeasurementSettingsRepository` must do (MM-156), in memory and in the database. */
export function measurementSettingsRepositoryContract(
  name: string,
  create: () => MeasurementSettingsRepository | Promise<MeasurementSettingsRepository>,
): void {
  describe(`${name} as a MeasurementSettingsRepository`, () => {
    let repo: MeasurementSettingsRepository;
    beforeEach(async () => {
      repo = await create();
    });

    it('starts with the waist only, no side and the suggestion not answered', async () => {
      const settings = await first(repo.watchMeasurementSettings());
      expect([...settings.sites]).toEqual([]);
      expect(settings.limbSide).toBeUndefined();
      expect(settings.suggestionAnswered).toBe(false);
    });

    it('keeps the sites, the side and the answer', async () => {
      await repo.saveMeasurementSettings(
        new MeasurementSettings({ sites: ['thigh', 'hips', 'upperArm'], limbSide: 'left', suggestionAnswered: true }),
      );
      const settings = await first(repo.watchMeasurementSettings());
      expect([...settings.sites].sort()).toEqual(['hips', 'thigh', 'upperArm']);
      expect(settings.limbSide).toBe('left');
      expect(settings.suggestionAnswered).toBe(true);
    });

    it('declining is kept with no site added, and a site taken away is gone', async () => {
      await repo.saveMeasurementSettings(new MeasurementSettings({ sites: ['neck'] }));
      await repo.saveMeasurementSettings(new MeasurementSettings({ sites: [], suggestionAnswered: true }));
      const settings = await first(repo.watchMeasurementSettings());
      expect([...settings.sites]).toEqual([]);
      expect(settings.suggestionAnswered).toBe(true);
    });

    it('the waist is never one of the sites: it is always measured', async () => {
      await repo.saveMeasurementSettings(new MeasurementSettings({ sites: ['waist', 'calf'] }));
      expect([...(await first(repo.watchMeasurementSettings())).sites]).toEqual(['calf']);
    });

    it('emits the current settings first, then each change', async () => {
      await expectChangeEmits(repo.watchMeasurementSettings(), {
        see: (s) => s.sites.size,
        before: 0,
        change: () => repo.saveMeasurementSettings(new MeasurementSettings({ sites: ['chest'] })),
        after: 1,
      });
    });
  });
}
