import type { CalendarDate } from '../domain/CalendarDate';
import type { MenstruationDay } from '../domain/MenstruationDay';
import type { MenstruationRepository } from '../domain/repositories/MenstruationRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `MenstruationRepository` held in memory (MM-20). */
export class InMemoryMenstruationRepository implements MenstruationRepository {
  private readonly days = new ObservableValue<ReadonlySet<CalendarDate>>(new Set());

  watchFlowDays(): Watched<MenstruationDay[]> {
    return this.days.watchAs((days) => [...days].sort((a, b) => a.compareTo(b)).map((date) => ({ date })));
  }

  async markFlowDay(date: CalendarDate): Promise<void> {
    if (this.days.value.has(date)) return;
    this.days.value = new Set([...this.days.value, date]);
  }

  async unmarkFlowDay(date: CalendarDate): Promise<void> {
    if (!this.days.value.has(date)) return;
    const next = new Set(this.days.value);
    next.delete(date);
    this.days.value = next;
  }

  clear(): void {
    this.days.value = new Set();
  }
}
