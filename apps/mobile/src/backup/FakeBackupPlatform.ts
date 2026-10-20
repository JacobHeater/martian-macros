import type { BackupPlatform } from './BackupPlatform';
import type { SaveOutcome } from './SaveOutcome';

/**
 * A backup platform for tests and stories (MM-63): the snapshot is whatever
 * bytes it was given, saves are kept, and a pick returns what the test put
 * there.
 */
export class FakeBackupPlatform implements BackupPlatform {
  /** What `snapshot` gives; a test sets it to a database's bytes. */
  snapshotBytes: () => Promise<Uint8Array>;
  readonly saved: { name: string; file: Uint8Array }[] = [];
  /** What the next `pick` gives; undefined is a cancelled pick. */
  toPick: Uint8Array | undefined;
  outcome: SaveOutcome = 'saved';

  constructor(snapshot: () => Promise<Uint8Array> = async () => new Uint8Array()) {
    this.snapshotBytes = snapshot;
  }

  snapshot(): Promise<Uint8Array> {
    return this.snapshotBytes();
  }

  async save(file: Uint8Array, name: string): Promise<SaveOutcome> {
    if (this.outcome !== 'cancelled') this.saved.push({ name, file });
    return this.outcome;
  }

  async pick(): Promise<Uint8Array | undefined> {
    return this.toPick;
  }
}
