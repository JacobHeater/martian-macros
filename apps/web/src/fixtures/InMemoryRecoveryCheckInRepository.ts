import type { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import type { RecoveryCheckInRepository } from '../domain/repositories/RecoveryCheckInRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `RecoveryCheckInRepository` held in memory. */
export class InMemoryRecoveryCheckInRepository implements RecoveryCheckInRepository {
  private readonly checkIns = new ObservableValue<readonly RecoveryCheckIn[]>([]);

  watchRecoveryCheckIns(): Watched<RecoveryCheckIn[]> {
    return this.checkIns.watchAs((all) => [...all]);
  }

  async saveRecoveryCheckIn(checkIn: RecoveryCheckIn): Promise<void> {
    this.checkIns.value = [...this.checkIns.value.filter((existing) => existing.date !== checkIn.date), checkIn].sort(
      (a, b) => a.date.compareTo(b.date),
    );
  }

  /** Empties the store (used by `InMemoryDataEraser`). */
  clear(): void {
    this.checkIns.value = [];
  }
}
