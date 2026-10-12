import type { Unsubscribe } from '../lang/Unsubscribe';
import { Cell } from './Cell';

/**
 * A value worked out from other cells. It is worked out again whenever one
 * of the cells it read changes; which cells those are is found by watching
 * what `compute` reads, so a rule that looks at another day's food next
 * time simply starts watching that day.
 */
export class DerivedCell<T> extends Cell<T> {
  private readonly compute: () => T;
  private readonly sources = new Map<Cell<unknown>, Unsubscribe>();
  private computing = false;
  private stale = false;

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
  }

  private recompute(): void {
    if (this.computing) {
      this.stale = true;
      return;
    }
    this.computing = true;
    try {
      do {
        this.stale = false;
        const [next, read] = Cell.tracking(this.compute);
        for (const [source, stop] of [...this.sources]) {
          if (read.has(source)) continue;
          stop();
          this.sources.delete(source);
        }
        for (const source of read) {
          if (this.sources.has(source)) continue;
          const before = source.peek();
          let subscribed = false;
          // A cell tells a new watcher its value at once; only later changes mean working this out again.
          const stop = source.subscribe(() => {
            if (subscribed) this.recompute();
          });
          subscribed = true;
          this.sources.set(source, stop);
          // Being watched may have woken the source and changed it, so what was read is out of date.
          if (!Object.is(before, source.peek())) this.stale = true;
        }
        this.set(next);
      } while (this.stale && this.watched);
    } finally {
      this.computing = false;
    }
  }
}
