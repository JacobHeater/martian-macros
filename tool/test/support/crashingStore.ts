import type { PrSnapshot } from '../../src/ci/prSnapshot.ts';
import type { WatchHealth } from '../../src/ci/watchHealth.ts';
import { WatchStore } from '../../src/ci/watchStore.ts';

/**
 * A store whose process dies after the events are written and before the
 * snapshot is.
 */
export class CrashingStore extends WatchStore {
  override saveState(_id: string, _state: { snapshot: PrSnapshot | undefined; health: WatchHealth }): void {
    throw new Error('the process died here');
  }
}
