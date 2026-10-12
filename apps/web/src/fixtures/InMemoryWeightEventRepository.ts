import type { WeightEventRepository } from '../domain/repositories/WeightEventRepository';
import type { WeightEvent } from '../domain/WeightEvent';
import { WeightEventType } from '../domain/WeightEventType';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

const same = (a: WeightEvent, b: WeightEvent) => a.date === b.date && a.type === b.type;

/** `WeightEventRepository` held in memory. */
export class InMemoryWeightEventRepository implements WeightEventRepository {
  private readonly events = new ObservableValue<readonly WeightEvent[]>([]);

  watchWeightEvents(): Watched<WeightEvent[]> {
    return this.events.watchAs((all) => [...all]);
  }

  async saveWeightEvent(event: WeightEvent): Promise<void> {
    this.events.value = [...this.events.value.filter((existing) => !same(existing, event)), event].sort((a, b) => {
      const byDate = a.date.compareTo(b.date);
      return byDate !== 0 ? byDate : WeightEventType.values.indexOf(a.type) - WeightEventType.values.indexOf(b.type);
    });
  }

  async deleteWeightEvent(event: WeightEvent): Promise<void> {
    this.events.value = this.events.value.filter((existing) => !same(existing, event));
  }

  /** Empties the store (used by `InMemoryDataEraser`). */
  clear(): void {
    this.events.value = [];
  }
}
