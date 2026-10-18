import type { InsightSnooze } from '../engine/InsightSnooze';
import type { InsightSnoozeRepository } from '../engine/InsightSnoozeRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `InsightSnoozeRepository` held in memory. */
export class InMemoryInsightSnoozeRepository implements InsightSnoozeRepository {
  private readonly snoozes = new ObservableValue<readonly InsightSnooze[]>([]);

  watchInsightSnoozes(): Watched<InsightSnooze[]> {
    return this.snoozes.watchAs((all) => [...all].sort((a, b) => a.kind.localeCompare(b.kind) || a.subject.localeCompare(b.subject)));
  }

  async saveInsightSnooze(snooze: InsightSnooze): Promise<void> {
    this.snoozes.value = [...this.snoozes.value.filter((s) => !(s.kind === snooze.kind && s.subject === snooze.subject)), snooze];
  }

  async removeInsightSnooze(kind: string, subject: string): Promise<void> {
    this.snoozes.value = this.snoozes.value.filter((s) => !(s.kind === kind && s.subject === subject));
  }

  clear(): void {
    this.snoozes.value = [];
  }
}
