import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightRepository } from '../domain/repositories/WeightRepository';
import type { WeightObservation } from '../domain/WeightObservation';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `WeightRepository` held in memory. */
export class InMemoryWeightRepository implements WeightRepository {
  private readonly byDay = new ObservableValue<ReadonlyMap<number, WeightObservation>>(new Map());

  watchWeights(): Watched<WeightObservation[]> {
    return this.byDay.watchAs((byDay) =>
      [...byDay.keys()].sort((a, b) => a - b).map((day) => byDay.get(day) as WeightObservation),
    );
  }

  async saveWeight(date: CalendarDate, weightKg: number): Promise<void> {
    const existing = this.byDay.value.get(date.epochDay);
    this.byDay.value = new Map(this.byDay.value).set(date.epochDay, {
      date,
      weightKg,
      // An update keeps the source of the reading it replaces.
      deviceId: existing?.deviceId,
    });
  }

  async deleteWeight(date: CalendarDate): Promise<void> {
    const next = new Map(this.byDay.value);
    next.delete(date.epochDay);
    this.byDay.value = next;
  }

  clear(): void {
    this.byDay.value = new Map();
  }
}
