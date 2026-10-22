import type { DeviceLock } from '../domain/integration/DeviceLock';
import { ValueCell } from './ValueCell';

/**
 * The progress photos behind the phone's own lock (MM-157), shared by every
 * screen that shows them: the photos, the camera and the comparison.
 *
 * - The lock is asked when the first of them opens, and once only however
 *   many open together or however often React mounts one (StrictMode).
 * - When the last of them closes, the photos lock again: the next opening
 *   asks again.
 * - When the app goes to the background while one shows, the photos lock,
 *   and the lock is asked again on the way back. The phone's own lock
 *   screen can itself put the app in the background (Android's credential
 *   screen is an activity of its own), so going away while the lock is
 *   being asked is not a reason to ask again.
 *
 * A phone with no lock set opens the photos as it opens the rest of the app.
 */
export class PhotoLock {
  /** Asking (nothing shown), open, or locked (the lock was not passed). */
  readonly status = new ValueCell<'asking' | 'open' | 'locked'>('asking');

  private readonly lock: DeviceLock;
  private viewers = 0;
  private asking: Promise<void> | undefined;
  /** Changed by every relock, so an answer to an earlier asking is not taken. */
  private generation = 0;
  private lockedWhileAway = false;

  constructor(lock: DeviceLock) {
    this.lock = lock;
  }

  /** A screen showing photos opened: the lock is asked unless open. Gives the way to say it closed. */
  enter(): () => void {
    this.viewers++;
    if (this.status.peek() !== 'open') void this.unlock();
    let left = false;
    return () => {
      if (left) return;
      left = true;
      this.viewers--;
      // A screen that closes and opens again in the same step (StrictMode, or one replaced by another) is not a leaving.
      queueMicrotask(() => {
        if (this.viewers === 0) this.relock();
      });
    };
  }

  /** Asks for the phone's lock, unless it is being asked already. */
  unlock(): Promise<void> {
    if (this.asking !== undefined) return this.asking;
    const mine = this.generation;
    this.status.put('asking');
    const settle = (status: 'open' | 'locked') => {
      if (mine !== this.generation) return;
      this.asking = undefined;
      this.status.put(status);
    };
    this.asking = this.lock.unlock('Unlock to see your progress photos.').then(
      (outcome) => settle(outcome === 'refused' ? 'locked' : 'open'),
      () => settle('locked'),
    );
    return this.asking;
  }

  /** The app went to the background: the photos lock while a screen shows them, unless the lock is being asked. */
  away(): void {
    if (this.viewers === 0 || this.asking !== undefined) return;
    this.relock();
    this.lockedWhileAway = true;
  }

  /** The app came back: the lock is asked again if the photos locked while it was away. */
  back(): void {
    if (!this.lockedWhileAway) return;
    this.lockedWhileAway = false;
    if (this.viewers > 0) void this.unlock();
  }

  private relock(): void {
    this.generation++;
    this.asking = undefined;
    this.lockedWhileAway = false;
    this.status.put('asking');
  }
}
