import type { CalendarDate } from '../domain/CalendarDate';
import type { DayCompleteness } from '../domain/DayCompleteness';
import type { DayMarkRepository } from '../domain/repositories/DayMarkRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `DayMarkRepository` held in memory. */
export class InMemoryDayMarkRepository implements DayMarkRepository {
  private readonly marks = new ObservableValue<ReadonlyMap<number, DayCompleteness>>(new Map());

  /**
   * Every mark keyed by epoch day, for implementations that derive from
   * the marks (see `InMemoryIntakeReader`).
   */
  watchAll(): Watched<ReadonlyMap<number, DayCompleteness>> {
    return this.marks.watch();
  }

  watchCompleteness(date: CalendarDate): Watched<DayCompleteness> {
    return this.marks.watchAs((marks) => marks.get(date.epochDay) ?? 'unmarked');
  }

  async setCompleteness(date: CalendarDate, completeness: DayCompleteness): Promise<void> {
    this.marks.value = new Map(this.marks.value).set(date.epochDay, completeness);
  }

  clear(): void {
    this.marks.value = new Map();
  }
}
