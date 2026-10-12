import type { Unsubscribe } from '../lang/Unsubscribe';
import { Cell } from './Cell';

/**
 * A value worked out from other cells. It is worked out again whenever one
 * of the cells it read changes; which cells those are is found by watching
 * what `compute` reads, so a rule that looks at another day's food next
 * time simply starts watching that day.
 *
 * It is never read out of date (MM-233). A cell that changes tells its
 * watchers one after another, so a watcher told early could read another
 * cell that had not been told yet, and work something out from one new
 * value and one old. So a derived cell checks, whenever it is read, that
 * what it read last time is what is there now, and works itself out again
 * first if not.
 */
export class DerivedCell<T> extends Cell<T> {
  private readonly compute: () => T;
  private readonly sources = new Map<Cell<unknown>, Unsubscribe>();
  /** The version of each source that the value held was worked out from. */
  private seen: ReadonlyMap<Cell<unknown>, number> = new Map();
  private computing = false;

  constructor(compute: () => T) {
    super(Cell.tracking(compute)[0]);
    this.compute = compute;
  }

  protected override wake(): void {
    this.recompute();
  }

  protected override sleep(): void {
    for (const stop of this.sources.values()) stop();
    this.sources.clear();
    this.seen = new Map();
  }

  protected override refresh(): void {
    if (this.watched && !this.computing && this.outOfDate()) this.recompute();
  }

  /** Whether a source has changed since the value held was worked out. */
  private outOfDate(): boolean {
    for (const [source, version] of this.seen) {
      if (source.version !== version) return true;
    }
    return false;
  }

  private recompute(): void {
    // A source that changes while this is being worked out is seen by the
    // check at the end of the loop below.
    if (this.computing) return;
    this.computing = true;
    try {
      do {
        const [next, read] = Cell.tracking(this.compute);
        for (const [source, stop] of [...this.sources]) {
          if (read.has(source)) continue;
          stop();
          this.sources.delete(source);
        }
        for (const source of read.keys()) {
          if (this.sources.has(source)) continue;
          let subscribed = false;
          // A cell tells a new watcher its value at once; only later changes mean working this out again.
          const stop = source.subscribe(() => {
            // Already worked out again if something read this since the change.
            if (subscribed && this.outOfDate()) this.recompute();
          });
          subscribed = true;
          this.sources.set(source, stop);
        }
        // Being watched may have woken a source and changed it since it was
        // read; the versions it was read at say so.
        this.seen = read;
        this.set(next);
      } while (this.watched && this.outOfDate());
    } finally {
      this.computing = false;
    }
  }
}
