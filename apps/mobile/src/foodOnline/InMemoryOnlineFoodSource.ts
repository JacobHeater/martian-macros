import type { Denied } from '../domain/integration/Denied';
import { NotFound } from '../domain/integration/NotFound';
import type { Outcome } from '../domain/integration/Outcome';
import { Succeeded } from '../domain/integration/Succeeded';
import type { Unavailable } from '../domain/integration/Unavailable';
import type { PackEntry } from '../foodCatalog/PackEntry';
import type { OnlineFoodSource } from './OnlineFoodSource';

/**
 * An `OnlineFoodSource` over entries in memory (MM-58), for tests and
 * stories: no network. It counts the questions asked, so a test can prove
 * none was, and can be told to fail as a phone without signal would.
 */
export class InMemoryOnlineFoodSource implements OnlineFoodSource {
  readonly id: string;
  readonly entries: PackEntry[];
  /** Every barcode and query asked, in order. */
  readonly asked: string[] = [];
  private failure: Unavailable | Denied | undefined;

  constructor(id: string, entries: readonly PackEntry[] = []) {
    this.id = id;
    this.entries = [...entries];
  }

  failWith(failure: Unavailable | Denied): void {
    this.failure = failure;
  }

  recover(): void {
    this.failure = undefined;
  }

  async byBarcode(gtin14: string): Promise<Outcome<PackEntry>> {
    this.asked.push(gtin14);
    if (this.failure !== undefined) return this.failure;
    const entry = this.entries.find((e) => e.barcodes?.includes(gtin14));
    return entry === undefined ? new NotFound() : new Succeeded(entry);
  }

  async search(query: string, { limit = 20 }: { limit?: number } = {}): Promise<Outcome<PackEntry[]>> {
    this.asked.push(query);
    if (this.failure !== undefined) return this.failure;
    const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    if (words.length === 0) return new Succeeded([]);
    const hits = this.entries.filter((e) =>
      words.every((w) => e.food.name.toLowerCase().includes(w) || (e.food.brand ?? '').toLowerCase().includes(w)),
    );
    return new Succeeded(hits.slice(0, limit));
  }
}
