import type { Watched } from '../lang/Watched';

/**
 * A value that can be read now and watched. Watching gives the current
 * value first and then every change, like a database query that is watched.
 */
export class ObservableValue<T> {
  private current: T;
  private readonly listeners = new Set<(value: T) => void>();

  constructor(value: T) {
    this.current = value;
  }

  get value(): T {
    return this.current;
  }

  set value(next: T) {
    this.current = next;
    for (const listener of [...this.listeners]) listener(next);
  }

  watch(): Watched<T> {
    return this.watchAs((value) => value);
  }

  /** Watches what `view` makes of the value. */
  watchAs<R>(view: (value: T) => R): Watched<R> {
    return {
      subscribe: (listener) => {
        const tell = (value: T) => listener(view(value));
        tell(this.current);
        this.listeners.add(tell);
        return () => {
          this.listeners.delete(tell);
        };
      },
    };
  }
}
