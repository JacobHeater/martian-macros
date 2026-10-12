import type { SetupRepository } from '../domain/repositories/SetupRepository';
import type { UserSetup } from '../domain/UserSetup';
import type { Watched } from '../lang/Watched';
import { ObservableValue } from './ObservableValue';

/** `SetupRepository` held in memory. */
export class InMemorySetupRepository implements SetupRepository {
  private readonly setup = new ObservableValue<UserSetup | undefined>(undefined);

  watchSetup(): Watched<UserSetup | undefined> {
    return this.setup.watch();
  }

  async loadSetup(): Promise<UserSetup | undefined> {
    return this.setup.value;
  }

  async saveSetup(setup: UserSetup): Promise<void> {
    this.setup.value = setup;
  }

  /** Empties the store (used by `InMemoryDataEraser`). */
  clear(): void {
    this.setup.value = undefined;
  }
}
