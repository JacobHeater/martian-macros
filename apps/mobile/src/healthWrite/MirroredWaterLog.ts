import type { CalendarDate } from '../domain/CalendarDate';
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import type { WaterEntry } from '../domain/water/WaterEntry';
import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { Watched } from '../lang/Watched';
import { waterRecordId } from './waterRecordId';

/**
 * The water log, told to the phone's health platform as it changes
 * (MM-314): one record per drink at the time it was logged, written again
 * when its amount changes and removed when it is removed. The app's log is
 * saved first and is the same whatever the platform does; writing only
 * happens while writing water is on. Nothing is read back.
 */
export class MirroredWaterLog implements WaterRepository {
  private readonly log: WaterRepository;
  private readonly platform: HealthIntakeWriter;

  constructor({ log, platform }: { log: WaterRepository; platform: HealthIntakeWriter }) {
    this.log = log;
    this.platform = platform;
  }

  watchWater(date: CalendarDate): Watched<WaterEntry[]> {
    return this.log.watchWater(date);
  }

  watchWaterSince(since: CalendarDate): Watched<WaterEntry[]> {
    return this.log.watchWaterSince(since);
  }

  async addWater(entry: WaterEntry): Promise<number> {
    const id = await this.log.addWater(entry);
    await this.platform.writeWater({ id: waterRecordId(id), at: entry.at, ml: entry.ml }).catch(() => false);
    return id;
  }

  async updateWater(entry: WaterEntry): Promise<void> {
    await this.log.updateWater(entry);
    await this.platform.writeWater({ id: waterRecordId(entry.id), at: entry.at, ml: entry.ml }).catch(() => false);
  }

  async removeWater(id: number): Promise<void> {
    await this.log.removeWater(id);
    await this.platform.removeWater(waterRecordId(id)).catch(() => false);
  }
}
