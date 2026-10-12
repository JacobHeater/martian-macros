import type { DataEraser } from '../domain/repositories/DataEraser';

/** `DataEraser` that runs a set of clear callbacks. */
export class InMemoryDataEraser implements DataEraser {
  private readonly clears: readonly (() => void)[];

  constructor(clears: readonly (() => void)[]) {
    this.clears = clears;
  }

  async eraseAll(): Promise<void> {
    for (const clear of this.clears) clear();
  }
}
