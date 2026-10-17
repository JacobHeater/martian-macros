import type { InsightArea } from '../domain/InsightArea';
import type { InsightSwitches } from './InsightSwitches';

/**
 * The switches of Settings > Coach, held while its screens are open and
 * shared between them. Not stored: MM-364 stores them with the other
 * preferences once the design is through the panel.
 */
export class InsightSwitchesDraft {
  private value: InsightSwitches = { all: true, offAreas: new Set(), offRules: new Set() };
  private readonly listeners = new Set<() => void>();

  readonly get = (): InsightSwitches => this.value;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setAll(on: boolean): void {
    this.put({ ...this.value, all: on });
  }

  setArea(area: InsightArea, on: boolean): void {
    this.put({ ...this.value, offAreas: toggled(this.value.offAreas, area, on) });
  }

  setRule(title: string, on: boolean): void {
    this.put({ ...this.value, offRules: toggled(this.value.offRules, title, on) });
  }

  private put(value: InsightSwitches): void {
    this.value = value;
    for (const listener of this.listeners) listener();
  }
}

/** `off` with `key` taken out when it is switched on, put in when off. */
function toggled<T>(off: ReadonlySet<T>, key: T, on: boolean): ReadonlySet<T> {
  const next = new Set(off);
  if (on) next.delete(key);
  else next.add(key);
  return next;
}
