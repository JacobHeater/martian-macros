import type { SleepRepository } from '../domain/repositories/SleepRepository';
import type { SleepNight } from '../domain/SleepNight';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `SleepRepository` held in memory (MM-250). */
export class InMemorySleepRepository implements SleepRepository {
  private readonly byDay = new ObservableValue<ReadonlyMap<number, SleepNight>>(new Map());

  watchSleepNights(): Watched<SleepNight[]> {
    return this.byDay.watchAs((byDay) =>
      [...byDay.keys()].sort((a, b) => a - b).map((day) => byDay.get(day) as SleepNight),
    );
  }

  async saveSleepNight(night: SleepNight): Promise<void> {
    this.byDay.value = new Map(this.byDay.value).set(night.date.epochDay, night);
  }

  clear(): void {
    this.byDay.value = new Map();
  }
}
