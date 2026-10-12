import type { Pause } from '../domain/Pause';
import type { PauseRepository } from '../domain/repositories/PauseRepository';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `PauseRepository` held in memory. */
export class InMemoryPauseRepository implements PauseRepository {
  private readonly pauses = new ObservableValue<readonly Pause[]>([]);

  watchPauses(): Watched<Pause[]> {
    return this.pauses.watchAs((all) => [...all]);
  }

  async savePause(pause: Pause): Promise<void> {
    this.pauses.value = [...this.pauses.value.filter((existing) => existing.from !== pause.from), pause].sort((a, b) =>
      a.from.compareTo(b.from),
    );
  }

  async deletePause(pause: Pause): Promise<void> {
    this.pauses.value = this.pauses.value.filter((existing) => existing.from !== pause.from);
  }

  /** Empties the store (used by `InMemoryDataEraser`). */
  clear(): void {
    this.pauses.value = [];
  }
}
