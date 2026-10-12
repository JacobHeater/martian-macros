import type { Denied } from '../domain/integration/Denied';
import type { FoodBarcodeLookup } from '../domain/integration/FoodBarcodeLookup';
import type { FoodItem } from '../domain/integration/FoodItem';
import type { FoodSearch } from '../domain/integration/FoodSearch';
import { NotFound } from '../domain/integration/NotFound';
import type { Outcome } from '../domain/integration/Outcome';
import { Succeeded } from '../domain/integration/Succeeded';
import type { Unavailable } from '../domain/integration/Unavailable';

/**
 * A `FoodSearch` and `FoodBarcodeLookup` over a list of items in memory.
 * Script it to fail with `failWith` to test offline and denied paths.
 */
export class InMemoryFoodCatalog implements FoodSearch, FoodBarcodeLookup {
  private readonly items: readonly FoodItem[];
  private failure: Unavailable | Denied | undefined;

  constructor(items: readonly FoodItem[]) {
    this.items = items;
  }

  /** Every following call answers with this failure until `recover` is called. */
  failWith(failure: Unavailable | Denied): void {
    this.failure = failure;
  }

  recover(): void {
    this.failure = undefined;
  }

  async search(query: string, { limit = 25 }: { limit?: number } = {}): Promise<Outcome<FoodItem[]>> {
    if (this.failure !== undefined) return this.failure;
    const needle = query.trim().toLowerCase();
    if (needle === '') return new Succeeded([]);
    const hits = this.items.filter(
      (item) => item.name.toLowerCase().includes(needle) || (item.brand?.toLowerCase().includes(needle) ?? false),
    );
    return new Succeeded(hits.slice(0, Math.max(0, limit)));
  }

  async lookup(gtin14: string): Promise<Outcome<FoodItem>> {
    if (this.failure !== undefined) return this.failure;
    const item = this.items.find((candidate) => candidate.barcode === gtin14);
    return item === undefined ? new NotFound() : new Succeeded(item);
  }
}
