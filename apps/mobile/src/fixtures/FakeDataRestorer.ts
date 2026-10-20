import type { BackupContents } from '../domain/backup/BackupContents';
import type { DataRestorer } from '../domain/repositories/DataRestorer';

const nothing: BackupContents = { weighIns: 0, foodDays: 0, workouts: 0, customFoods: 0, from: undefined, to: undefined, hasSetup: false };

/**
 * A restorer for tests and stories over in-memory stores (MM-63): it says
 * of a backup and of this phone what it was told to, and records a restore
 * instead of doing one.
 */
export class FakeDataRestorer implements DataRestorer {
  /** What any backup is described as. */
  toDescribe: BackupContents = nothing;
  here: BackupContents = nothing;
  readonly restoredFrom: Uint8Array[] = [];
  /** Called on a restore, so a test can change the stores as the real restore would. */
  onRestore: (snapshot: Uint8Array) => Promise<void> = async () => undefined;

  async describe(): Promise<BackupContents> {
    return this.toDescribe;
  }

  async describeHere(): Promise<BackupContents> {
    return this.here;
  }

  async restoreFrom(snapshot: Uint8Array): Promise<void> {
    this.restoredFrom.push(snapshot);
    await this.onRestore(snapshot);
  }
}
