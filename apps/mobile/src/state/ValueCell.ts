import { Cell } from './Cell';

/** A cell whose value is set from outside: today's date, a count of imports. */
export class ValueCell<T> extends Cell<T> {
  /** Sets the value and tells every watcher, unless it is the value already held. */
  put(next: T): void {
    this.set(next);
  }
}
