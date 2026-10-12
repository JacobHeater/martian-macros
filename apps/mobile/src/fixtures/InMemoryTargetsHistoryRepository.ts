import type { CalendarDate } from '../domain/CalendarDate';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import type { TargetsRecord } from '../engine/TargetsRecord';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `TargetsHistoryRepository` held in memory. */
export class InMemoryTargetsHistoryRepository implements TargetsHistoryRepository {
  private readonly byDay = new ObservableValue<ReadonlyMap<number, TargetsRecord>>(new Map());

  watchTargetsHistory(): Watched<TargetsRecord[]> {
    return this.byDay.watchAs((byDay) =>
      [...byDay.keys()].sort((a, b) => a - b).map((day) => byDay.get(day) as TargetsRecord),
    );
  }

  async saveTargets(record: TargetsRecord): Promise<void> {
    this.byDay.value = new Map(this.byDay.value).set(record.effectiveFrom.epochDay, record);
  }

  async markSummariesSeenThrough(effectiveFrom: CalendarDate): Promise<void> {
    this.byDay.value = new Map(
      [...this.byDay.value].map(([day, record]) => [
        day,
        day <= effectiveFrom.epochDay ? record.copyWith({ summarySeen: true }) : record,
      ]),
    );
  }

  clear(): void {
    this.byDay.value = new Map();
  }
}
