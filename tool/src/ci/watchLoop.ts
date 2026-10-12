import { CiWatch } from './ciWatch.ts';
import { GhFailure } from './ghFailure.ts';

/**
 * Polls one watch until there is nothing more to see: the pull request is
 * merged or closed, it is asked to stop, it has run its allowed time, or
 * GitHub cannot be read and retrying is pointless or has gone on too long.
 * It never runs forever and never hurries GitHub.
 */
export class WatchLoop {
  private readonly watch: CiWatch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => Date;
  private readonly pid: number | undefined;
  private readonly maxLifetimeMs: number;
  private readonly maxConsecutiveFailures: number;
  private readonly maxBackoffMs: number;

  constructor(init: {
    watch: CiWatch;
    sleep: (ms: number) => Promise<void>;
    now: () => Date;
    pid?: number;
    maxLifetimeMs?: number;
    maxConsecutiveFailures?: number;
    maxBackoffMs?: number;
  }) {
    this.watch = init.watch;
    this.sleep = init.sleep;
    this.now = init.now;
    this.pid = init.pid;
    this.maxLifetimeMs = init.maxLifetimeMs ?? 8 * 3600_000;
    this.maxConsecutiveFailures = init.maxConsecutiveFailures ?? 8;
    this.maxBackoffMs = init.maxBackoffMs ?? 10 * 60_000;
  }

  /** Runs to the end and returns why it stopped. */
  async run(id: string): Promise<string> {
    const intervalMs = ((this.watch.store.watch(id)['intervalSeconds'] as number | undefined) ?? 60) * 1000;
    const started = this.now().getTime();
    let failures = 0;
    for (;;) {
      if (this.watch.stopRequested(id)) return this.end(id, 'stopRequested');
      if (this.now().getTime() - started >= this.maxLifetimeMs) return this.end(id, 'lifetimeReached');
      let waitMs = intervalMs;
      try {
        await this.watch.poll(id, { ...(this.pid === undefined ? {} : { pid: this.pid }), heartbeat: true });
        failures = 0;
        if (this.watch.store.snapshot(id)?.open === false) return this.end(id, 'pullRequestNoLongerOpen');
      } catch (error) {
        if (!(error instanceof GhFailure)) throw error;
        failures += 1;
        if (CiWatch.fatal(error)) return this.end(id, `${error.kind}Error`);
        if (failures >= this.maxConsecutiveFailures) return this.end(id, 'tooManyFailures');
        // Twice as long each time, and longer still when GitHub said to
        // slow down.
        const factor = 1 << Math.min(failures, 6);
        waitMs = intervalMs * factor;
        if (error.kind === 'rateLimit') waitMs = this.maxBackoffMs;
        if (waitMs > this.maxBackoffMs) waitMs = this.maxBackoffMs;
      }
      // Sleep in short steps so a stop request is seen soon.
      let slept = 0;
      const stepMs = 5000;
      while (slept < waitMs) {
        if (this.watch.stopRequested(id)) return this.end(id, 'stopRequested');
        const next = Math.min(waitMs - slept, stepMs);
        await this.sleep(next);
        slept += next;
      }
    }
  }

  private end(id: string, reason: string): string {
    this.watch.markStopped(id, reason);
    return reason;
  }
}
