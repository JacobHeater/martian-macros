import type { Unsubscribe } from '../lang/Unsubscribe';
import type { Watched } from '../lang/Watched';
import { Cell } from './Cell';
import { Loadable } from './Loadable';

/**
 * What a repository's `watch...` gives, as a cell: not ready until its
 * first value arrives, and failed if reading goes wrong. `open` is asked
 * for the thing to watch each time the cell wakes, and again whenever a
 * cell that `open` read changes (the food since sixty days before today is
 * a different question tomorrow).
 */
export class StreamCell<T> extends Cell<Loadable<T>> {
  private readonly open: () => Watched<T>;
  private stop: Unsubscribe | undefined;
  private readonly sources = new Map<Cell<unknown>, Unsubscribe>();

  constructor(open: () => Watched<T>) {
    super(Loadable.loading);
    this.open = open;
  }

  /** Asks again, after a read that went wrong. */
  retry(): void {
    if (!this.watched) return;
    this.set(Loadable.loading);
    this.connect();
  }

  protected override wake(): void {
    this.connect();
  }

  protected override sleep(): void {
    this.disconnect();
    for (const stop of this.sources.values()) stop();
    this.sources.clear();
  }

  private disconnect(): void {
    this.stop?.();
    this.stop = undefined;
  }

  private connect(): void {
    this.disconnect();
    const [watched, read] = Cell.tracking(this.open);
    for (const [source, stop] of [...this.sources]) {
      if (read.has(source)) continue;
      stop();
      this.sources.delete(source);
    }
    for (const source of read) {
      if (this.sources.has(source)) continue;
      let subscribed = false;
      const stop = source.subscribe(() => {
        if (subscribed) this.connect();
      });
      subscribed = true;
      this.sources.set(source, stop);
    }
    let current = true;
    const stop = watched.subscribe(
      (value) => {
        if (current) this.set(Loadable.of(value));
      },
      (error) => {
        if (current) this.set(Loadable.failed(error));
      },
    );
    this.stop = () => {
      current = false;
      stop();
    };
  }
}
