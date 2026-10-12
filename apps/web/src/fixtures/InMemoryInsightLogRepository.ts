import type { CalendarDate } from '../domain/CalendarDate';
import type { InsightLogEntry } from '../engine/InsightLogEntry';
import type { InsightLogRepository } from '../engine/InsightLogRepository';
import type { InsightRule } from '../engine/InsightRule';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `InsightLogRepository` held in memory. */
export class InMemoryInsightLogRepository implements InsightLogRepository {
  private readonly entries = new ObservableValue<readonly InsightLogEntry[]>([]);

  watchInsightLog(): Watched<InsightLogEntry[]> {
    return this.entries.watchAs((all) => [...all]);
  }

  async recordInsightShown(rule: InsightRule, day: CalendarDate): Promise<void> {
    // The sort keeps equal days in place, so entries of one day keep the order they were added in.
    this.entries.value = [...this.entries.value, { rule, shownOn: day }].sort((a, b) =>
      a.shownOn.compareTo(b.shownOn),
    );
  }

  async dismissInsight(rule: InsightRule, day: CalendarDate): Promise<void> {
    const all = this.entries.value;
    let index = all.length - 1;
    while (index >= 0 && (all[index] as InsightLogEntry).rule !== rule) index--;
    if (index < 0) return;
    const entry = all[index] as InsightLogEntry;
    this.entries.value = [
      ...all.slice(0, index),
      { rule, shownOn: entry.shownOn, dismissedOn: day },
      ...all.slice(index + 1),
    ];
  }

  clear(): void {
    this.entries.value = [];
  }
}
