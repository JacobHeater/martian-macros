import type { CalendarDate } from '../domain/CalendarDate';
import type { FindingDismissal } from '../engine/trends/FindingDismissal';
import type { TrendAnnouncement } from '../engine/trends/TrendAnnouncement';
import type { TrendLogRepository } from '../engine/trends/TrendLogRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `TrendLogRepository` held in memory (MM-605). */
export class InMemoryTrendLogRepository implements TrendLogRepository {
  private readonly announcements = new ObservableValue<readonly TrendAnnouncement[]>([]);
  private readonly dismissals = new ObservableValue<readonly FindingDismissal[]>([]);

  watchTrendAnnouncements(): Watched<TrendAnnouncement[]> {
    return this.announcements.watchAs((all) => [...all]);
  }

  watchFindingDismissals(): Watched<FindingDismissal[]> {
    return this.dismissals.watchAs((all) => [...all]);
  }

  async appendTrendAnnouncements(entries: readonly TrendAnnouncement[]): Promise<void> {
    if (entries.length === 0) return;
    // The sort keeps equal days in place, so entries of one day keep the order they were appended in.
    this.announcements.value = [...this.announcements.value, ...entries].sort((a, b) => a.on.compareTo(b.on));
  }

  async dismissFinding(findingId: string, day: CalendarDate): Promise<void> {
    const all = this.dismissals.value;
    if (all.some((d) => d.findingId === findingId && d.dismissedOn.epochDay === day.epochDay)) return;
    this.dismissals.value = [...all, { findingId, dismissedOn: day }].sort((a, b) =>
      a.dismissedOn.compareTo(b.dismissedOn),
    );
  }

  /** Forgets every announcement and dismissal, as erasing all data does. */
  clear(): void {
    this.announcements.value = [];
    this.dismissals.value = [];
  }
}
