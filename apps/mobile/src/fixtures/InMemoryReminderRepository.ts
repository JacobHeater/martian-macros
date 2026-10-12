import { ReminderKind } from '../domain/ReminderKind';
import type { ReminderSetting } from '../domain/ReminderSetting';
import type { ReminderRepository } from '../domain/repositories/ReminderRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `ReminderRepository` held in memory. */
export class InMemoryReminderRepository implements ReminderRepository {
  private readonly settings = new ObservableValue<readonly ReminderSetting[]>([]);

  watchReminders(): Watched<ReminderSetting[]> {
    return this.settings.watchAs((all) => [...all]);
  }

  async saveReminder(setting: ReminderSetting): Promise<void> {
    this.settings.value = [...this.settings.value.filter((existing) => existing.kind !== setting.kind), setting].sort(
      (a, b) => ReminderKind.values.indexOf(a.kind) - ReminderKind.values.indexOf(b.kind),
    );
  }

  /** Empties the store (used by `InMemoryDataEraser`). */
  clear(): void {
    this.settings.value = [];
  }
}
