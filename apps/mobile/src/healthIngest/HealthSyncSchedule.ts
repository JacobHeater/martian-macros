import type { HealthSyncReason } from './HealthSyncReason';

/**
 * When the health platform is read (MM-72). The data that matters changes
 * about once a day, so reading it every time the app flicks to the front
 * would be waste.
 *
 * - Opening the app always reads, so what the user sees is current even if
 *   no background run ever happened.
 * - Asking for it (Settings) always reads.
 * - Coming back to the front reads only when the last successful read is
 *   at least `resumeIntervalMs` old. A read that failed does not count, so
 *   the next return to the front tries again.
 */
export class HealthSyncSchedule {
  /** Fifteen minutes: long enough to skip app switching, short enough for a weigh-in to show the same morning. */
  static readonly resumeIntervalMs = 15 * 60 * 1000;

  /** Whether a read for `reason` is due, given when the last successful one finished. */
  static due(reason: HealthSyncReason, lastSyncedAt: Date | undefined, now: Date): boolean {
    if (reason !== 'resumed' || lastSyncedAt === undefined) return true;
    // A clock moved backwards reads again rather than waiting.
    const elapsed = now.getTime() - lastSyncedAt.getTime();
    return elapsed < 0 || elapsed >= HealthSyncSchedule.resumeIntervalMs;
  }
}
