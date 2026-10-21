import type { CalendarDate } from '../domain/CalendarDate';
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import type { WaterEntry } from '../domain/water/WaterEntry';
import type { HealthIntakeWriter } from '../healthIngest/HealthIntakeWriter';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';
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
  private readonly platform: HealthIntakeWriter & HealthWriteNamespace;

  constructor({ log, platform }: { log: WaterRepository; platform: HealthIntakeWriter & HealthWriteNamespace }) {
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
    await this.tell((namespace) =>
      this.platform.writeWater({ id: waterRecordId(namespace, id), at: entry.at, ml: entry.ml }),
    );
    return id;
  }

  async updateWater(entry: WaterEntry): Promise<void> {
    await this.log.updateWater(entry);
    await this.tell((namespace) =>
      this.platform.writeWater({ id: waterRecordId(namespace, entry.id), at: entry.at, ml: entry.ml }),
    );
  }

  async removeWater(id: number): Promise<void> {
    await this.log.removeWater(id);
    await this.tell((namespace) => this.platform.removeWater(waterRecordId(namespace, id)));
  }

  /** Tells the platform under this run's namespace (MM-522); a platform that fails changes nothing here. */
  private async tell(step: (namespace: string) => Promise<boolean>): Promise<boolean> {
    try {
      return await step(await this.platform.writeNamespace());
    } catch {
      return false;
    }
  }
}
