import type { CalendarDate } from '../domain/CalendarDate';
import type { DayKind } from '../domain/DayKind';
import type { DayKindRepository } from '../domain/repositories/DayKindRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `DayKindRepository` held in memory (MM-611). */
export class InMemoryDayKindRepository implements DayKindRepository {
  private readonly marks = new ObservableValue<ReadonlyMap<number, DayKind>>(new Map());

  watchDayKind(date: CalendarDate): Watched<DayKind> {
    return this.marks.watchAs((marks) => marks.get(date.epochDay) ?? 'none');
  }

  watchMarkedDays(): Watched<ReadonlyMap<number, DayKind>> {
    return this.marks.watch();
  }

  async setDayKind(date: CalendarDate, kind: DayKind): Promise<void> {
    const next = new Map(this.marks.value);
    if (kind === 'none') next.delete(date.epochDay);
    else next.set(date.epochDay, kind);
    this.marks.value = next;
  }

  /** Forgets every mark, as erasing all data does. */
  clear(): void {
    this.marks.value = new Map();
  }
}
