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
  /** The rows written of all rows a restore reports, in order, before `onRestore` runs (MM-702). */
  progressSteps: readonly (readonly [done: number, total: number])[] = [];
  /** Called on a restore, so a test can change the stores as the real restore would. */
  onRestore: (snapshot: Uint8Array) => Promise<void> = async () => undefined;

  async describe(): Promise<BackupContents> {
    return this.toDescribe;
  }

  async describeHere(): Promise<BackupContents> {
    return this.here;
  }

  async restoreFrom(snapshot: Uint8Array, progress?: (done: number, total: number) => void): Promise<void> {
    this.restoredFrom.push(snapshot);
    for (const [done, total] of this.progressSteps) progress?.(done, total);
    await this.onRestore(snapshot);
  }
}
