import { LimbSide } from '../domain/measurements/LimbSide';
import { MeasurementSettings } from '../domain/measurements/MeasurementSettings';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import type { MeasurementSettingsRepository } from '../domain/repositories/MeasurementSettingsRepository';
import type { Watched } from '../lang/Watched';
import type { AppDatabase } from './AppDatabase';
import { asFlag, flag, optionalNamed, text } from './columns';
import { upsert } from './upsert';

/**
 * `MeasurementSettingsRepository` kept in the database (MM-156): one row,
 * the sites as names joined by commas, none until saved.
 */
export class SqlMeasurementSettingsRepository implements MeasurementSettingsRepository {
  private readonly db: AppDatabase;

  constructor(db: AppDatabase) {
    this.db = db;
  }

  watchMeasurementSettings(): Watched<MeasurementSettings> {
    return this.db.watch(['measurement_settings'], async (db) => {
      const row = (await db.select('SELECT * FROM measurement_settings WHERE id = 1'))[0];
      if (row === undefined) return MeasurementSettings.none;
      const sites = text(row, 'sites');
      return new MeasurementSettings({
        sites: sites === '' ? [] : sites.split(',').filter((s): s is MeasurementSite => (MeasurementSite.values as readonly string[]).includes(s)),
        limbSide: optionalNamed(LimbSide.values, row, 'limb_side'),
        suggestionAnswered: flag(row, 'suggestion_answered'),
      });
    });
  }

  saveMeasurementSettings(settings: MeasurementSettings): Promise<void> {
    return this.db.write(['measurement_settings'], (db) =>
      upsert(db, 'measurement_settings', ['id'], {
        id: 1,
        // In the sites' fixed order, so the same choice is always the same text.
        sites: MeasurementSite.optional.filter((site) => settings.sites.has(site)).join(','),
        limb_side: settings.limbSide ?? null,
        suggestion_answered: asFlag(settings.suggestionAnswered),
      }),
    );
  }
}
