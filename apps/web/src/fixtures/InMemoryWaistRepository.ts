import type { CalendarDate } from '../domain/CalendarDate';
import type { WaistRepository } from '../domain/repositories/WaistRepository';
import { WaistObservation } from '../domain/WaistObservation';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `WaistRepository` held in memory. */
export class InMemoryWaistRepository implements WaistRepository {
  private readonly byDay = new ObservableValue<ReadonlyMap<number, WaistObservation>>(new Map());

  watchWaist(): Watched<WaistObservation[]> {
    return this.byDay.watchAs((byDay) =>
      [...byDay.keys()].sort((a, b) => a - b).map((day) => byDay.get(day) as WaistObservation),
    );
  }

  async saveWaist(
    date: CalendarDate,
    waistCm: number,
    { readings = [] }: { readings?: readonly number[] } = {},
  ): Promise<void> {
    this.byDay.value = new Map(this.byDay.value).set(
      date.epochDay,
      new WaistObservation({ date, waistCm, readings: Object.freeze([...readings]) }),
    );
  }

  clear(): void {
    this.byDay.value = new Map();
  }
}
