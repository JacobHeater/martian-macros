import type { Unsubscribe } from '../lang/Unsubscribe';
import type { Watched } from '../lang/Watched';

/** The cells read by whatever is being worked out right now. */
const reading: Set<Cell<unknown>>[] = [];

/**
 * A value that can be read now and watched. A cell does its work only
 * while something is watching it: `wake` is called when the first watcher
 * arrives and `sleep` when the last one leaves, so a day's food that no
 * screen shows is not read from the database again on every change.
 */
export class Cell<T> implements Watched<T> {
  private current: T;
  private readonly listeners = new Set<(value: T) => void>();

  constructor(initial: T) {
    this.current = initial;
  }

  /**
   * Runs `work` and gives what it returned with every cell whose value it
   * read.
   */
  static tracking<R>(work: () => R): readonly [result: R, read: ReadonlySet<Cell<unknown>>] {
    const read = new Set<Cell<unknown>>();
    reading.push(read);
    try {
      return [work(), read];
    } finally {
      reading.pop();
    }
  }

  /** The value now. While nothing watches the cell it may be out of date. */
  get value(): T {
    reading[reading.length - 1]?.add(this as Cell<unknown>);
    return this.current;
  }

  /** The value now, without counting as having read it. */
  peek(): T {
    return this.current;
  }

  get watched(): boolean {
    return this.listeners.size > 0;
  }

  subscribe(listener: (value: T) => void): Unsubscribe {
    const first = this.listeners.size === 0;
    let told = false;
    const tell = (value: T) => {
      told = true;
      listener(value);
    };
    this.listeners.add(tell);
    if (first) this.wake();
    // Waking may already have told it a fresh value; if not, it is told the one held.
    if (!told) tell(this.current);
    return () => {
      if (!this.listeners.delete(tell)) return;
      if (this.listeners.size === 0) this.sleep();
    };
  }

  /** Sets the value and tells every watcher, unless it is the value already held. */
  protected set(next: T): void {
    if (Object.is(next, this.current)) return;
    this.current = next;
    for (const listener of [...this.listeners]) listener(next);
  }

  protected wake(): void {}

  protected sleep(): void {}
}
