import { CalendarDate } from '../domain/CalendarDate';
import type { DailyStepsRepository } from '../domain/repositories/DailyStepsRepository';
import type { StepsDay } from '../domain/training/StepsDay';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `DailyStepsRepository` held in memory (MM-677), a total a day. */
export class InMemoryDailyStepsRepository implements DailyStepsRepository {
  private readonly byDay = new ObservableValue<ReadonlyMap<number, number>>(new Map());

  watchDailySteps(): Watched<StepsDay[]> {
    return this.byDay.watchAs((held) =>
      [...held.entries()].sort((a, b) => a[0] - b[0]).map(([epochDay, steps]) => ({ date: CalendarDate.fromEpochDay(epochDay), steps })),
    );
  }

  async saveDailySteps(days: readonly StepsDay[]): Promise<void> {
    const kept = days.filter((entry) => Number.isInteger(entry.steps) && entry.steps > 0);
    if (kept.length === 0) return;
    const next = new Map(this.byDay.value);
    for (const entry of kept) next.set(entry.date.epochDay, entry.steps);
    this.byDay.value = next;
  }

  clear(): void {
    this.byDay.value = new Map();
  }
}
