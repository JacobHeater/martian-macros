import type { CalendarDate } from '../domain/CalendarDate';
import type { CoachAdviceGiven } from '../engine/analysis/accountability/CoachAdviceGiven';
import type { CoachAdviceRecordRepository } from '../engine/analysis/accountability/CoachAdviceRecordRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `CoachAdviceRecordRepository` held in memory (MM-617). */
export class InMemoryCoachAdviceRecordRepository implements CoachAdviceRecordRepository {
  private readonly record = new ObservableValue<readonly CoachAdviceGiven[]>([]);

  watchAdviceGivenSince(since: CalendarDate): Watched<CoachAdviceGiven[]> {
    return this.record.watchAs((all) => all.filter((g) => !g.on.isBefore(since)));
  }

  async recordAdviceGiven(entries: readonly CoachAdviceGiven[]): Promise<void> {
    const all = [...this.record.value];
    const same = (a: CoachAdviceGiven, b: CoachAdviceGiven) => a.foodKey === b.foodKey && a.kind === b.kind && a.on === b.on;
    let added = false;
    for (const g of entries) {
      if (all.some((x) => same(x, g))) continue;
      all.push({ ...g });
      added = true;
    }
    if (!added) return;
    // The sort keeps equal days in place, so entries of one day keep the order they were recorded in.
    this.record.value = all.sort((a, b) => a.on.compareTo(b.on));
  }

  /** Forgets the whole record, as erasing all data does. */
  clear(): void {
    this.record.value = [];
  }
}
