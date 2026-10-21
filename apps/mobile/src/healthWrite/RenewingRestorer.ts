import type { BackupContents } from '../domain/backup/BackupContents';
import type { DataRestorer } from '../domain/repositories/DataRestorer';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';

/**
 * A restore, with the health platform's write namespace renewed after it
 * (MM-522): the restored entries' ids go on from the backup's, which may be
 * the ids of entries written to the platform since the backup was made.
 * Renewed, nothing written after the restore can replace them.
 */
export class RenewingRestorer implements DataRestorer {
  private readonly restorer: DataRestorer;
  private readonly ids: HealthWriteNamespace;

  constructor({ restorer, ids }: { restorer: DataRestorer; ids: HealthWriteNamespace }) {
    this.restorer = restorer;
    this.ids = ids;
  }

  describe(snapshot: Uint8Array): Promise<BackupContents> {
    return this.restorer.describe(snapshot);
  }

  describeHere(): Promise<BackupContents> {
    return this.restorer.describeHere();
  }

  async restoreFrom(snapshot: Uint8Array): Promise<void> {
    await this.restorer.restoreFrom(snapshot);
    await this.ids.renewWriteNamespace().catch(() => undefined);
  }
}
