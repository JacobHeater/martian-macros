import type { DataEraser } from '../domain/repositories/DataEraser';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';

/**
 * "Erase all data", with the health platform's write namespace renewed
 * after it (MM-522): entry ids start again once everything is erased, and a
 * new entry must never be written under the id of one written before, or
 * it would replace that record on the platform. What was written before
 * stays there, as the terms say. A namespace that cannot be renewed does
 * not stop the erase.
 */
export class RenewingEraser implements DataEraser {
  private readonly eraser: DataEraser;
  private readonly ids: HealthWriteNamespace;

  constructor({ eraser, ids }: { eraser: DataEraser; ids: HealthWriteNamespace }) {
    this.eraser = eraser;
    this.ids = ids;
  }

  async eraseAll(): Promise<void> {
    await this.eraser.eraseAll();
    await this.ids.renewWriteNamespace().catch(() => undefined);
  }
}
