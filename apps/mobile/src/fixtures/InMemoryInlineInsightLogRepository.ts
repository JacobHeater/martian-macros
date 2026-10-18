import type { CalendarDate } from '../domain/CalendarDate';
import type { InlineInsightLogEntry } from '../engine/InlineInsightLogEntry';
import type { InlineInsightLogRepository } from '../engine/InlineInsightLogRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `InlineInsightLogRepository` held in memory. */
export class InMemoryInlineInsightLogRepository implements InlineInsightLogRepository {
  private readonly entries = new ObservableValue<readonly InlineInsightLogEntry[]>([]);

  watchInlineInsightLog({ since }: { since: CalendarDate }): Watched<InlineInsightLogEntry[]> {
    return this.entries.watchAs((all) => all.filter((e) => !e.firstShownOn.isBefore(since)));
  }

  async recordInlineInsightShown(entry: InlineInsightLogEntry): Promise<void> {
    const all = this.entries.value;
    const known = all.some(
      (e) => e.kind === entry.kind && e.anchor.kind === entry.anchor.kind && e.anchor.id === entry.anchor.id,
    );
    if (known) return;
    // The sort keeps equal days in place, so entries of one day keep the order they were added in.
    this.entries.value = [...all, entry].sort((a, b) => a.firstShownOn.compareTo(b.firstShownOn));
  }

  clear(): void {
    this.entries.value = [];
  }
}
