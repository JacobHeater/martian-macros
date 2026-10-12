import { compareStrings } from '../lang/compareStrings';
import type { DropReason } from './DropReason';

const sum = (counts: Iterable<number>) => [...counts].reduce((a, b) => a + b, 0);

/**
 * Counts for one build: what each source gave, what was dropped and why,
 * and what was written. Every entry read is either written or dropped, once.
 */
export class BuildReport {
  readonly read = new Map<string, number>();
  readonly dropped = new Map<string, Map<DropReason, number>>();
  readonly written = new Map<string, number>();

  countRead(source: string): void {
    this.read.set(source, (this.read.get(source) ?? 0) + 1);
  }

  countDropped(source: string, reason: DropReason): void {
    let bySource = this.dropped.get(source);
    if (bySource === undefined) {
      bySource = new Map();
      this.dropped.set(source, bySource);
    }
    bySource.set(reason, (bySource.get(reason) ?? 0) + 1);
  }

  /** A food written to a pack came from `source`. */
  countWritten(source: string): void {
    this.written.set(source, (this.written.get(source) ?? 0) + 1);
  }

  get totalRead(): number {
    return sum(this.read.values());
  }

  get totalWritten(): number {
    return sum(this.written.values());
  }

  get totalDropped(): number {
    return sum([...this.dropped.values()].flatMap((byReason) => [...byReason.values()]));
  }

  /** Entries read equal entries written plus entries dropped. */
  get reconciles(): boolean {
    return this.totalRead === this.totalWritten + this.totalDropped;
  }

  format(): string {
    let out = '';
    for (const source of [...this.read.keys()].sort(compareStrings)) {
      const dropped = this.dropped.get(source) ?? new Map<DropReason, number>();
      out +=
        `${source}: read ${this.read.get(source)}, written ${this.written.get(source) ?? 0}, ` +
        `dropped ${sum(dropped.values())}\n`;
      // Most dropped first; reasons dropped equally often stay in the order met.
      const reasons = [...dropped.entries()].sort((a, b) => b[1] - a[1]);
      for (const [reason, count] of reasons) out += `    ${reason}: ${count}\n`;
    }
    out +=
      `total: read ${this.totalRead}, written ${this.totalWritten}, dropped ${this.totalDropped}` +
      `${this.reconciles ? '' : '  (DOES NOT RECONCILE)'}\n`;
    return out;
  }
}
