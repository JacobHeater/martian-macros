import type { CalendarDate } from '../domain/CalendarDate';
import type { WaterRepository } from '../domain/repositories/WaterRepository';
import { WaterEntry } from '../domain/water/WaterEntry';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `WaterRepository` held in memory. Ids count up from 1 and are never reused. */
export class InMemoryWaterRepository implements WaterRepository {
  private readonly entries = new ObservableValue<readonly WaterEntry[]>([]);
  private nextId = 1;

  watchWater(date: CalendarDate): Watched<WaterEntry[]> {
    return this.entries.watchAs((all) =>
      all.filter((e) => e.date.epochDay === date.epochDay).sort((a, b) => a.at.getTime() - b.at.getTime() || a.id - b.id),
    );
  }

  async addWater(entry: WaterEntry): Promise<number> {
    const id = this.nextId++;
    this.entries.value = [...this.entries.value, new WaterEntry({ id, date: entry.date, ml: entry.ml, at: entry.at })];
    return id;
  }

  async removeWater(id: number): Promise<void> {
    this.entries.value = this.entries.value.filter((e) => e.id !== id);
  }

  clear(): void {
    this.entries.value = [];
  }
}
