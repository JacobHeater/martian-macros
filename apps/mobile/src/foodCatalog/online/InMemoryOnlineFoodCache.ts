import type { FoodGroup } from '../../domain/food/FoodGroup';
import { CatalogFood } from '../CatalogFood';
import type { CatalogServing } from '../CatalogServing';
import type { PackEntry } from '../PackEntry';
import type { SearchHit } from '../SearchHit';
import type { OnlineFoodCache } from './OnlineFoodCache';
import { onlinePackId } from './onlinePackId';

/** The online food cache in memory (MM-58), for tests and stories. */
export class InMemoryOnlineFoodCache implements OnlineFoodCache {
  readonly packId = onlinePackId;
  private readonly entries = new Map<number, PackEntry>();
  private nextId = 1;

  async remember(entry: PackEntry): Promise<CatalogFood> {
    const gtin = entry.barcodes?.[0];
    for (const [id, kept] of this.entries) {
      const sameBarcode = gtin !== undefined && kept.barcodes?.[0] === gtin;
      const sameRecord =
        entry.food.sourceId !== undefined && kept.food.source === entry.food.source && kept.food.sourceId === entry.food.sourceId;
      if (sameBarcode || sameRecord) this.entries.delete(id);
    }
    const id = this.nextId++;
    // Kept as the database keeps it: without a group (MM-616).
    const food = new CatalogFood({ ...entry.food, id, packId: onlinePackId, brand: entry.food.brand, group: undefined });
    this.entries.set(id, { ...entry, food });
    return food;
  }

  async count(): Promise<number> {
    return this.entries.size;
  }

  async clear(): Promise<void> {
    this.entries.clear();
  }

  async search(
    query: string,
    { limit = 25, offset = 0, group }: { limit?: number; offset?: number; group?: FoodGroup | undefined } = {},
  ): Promise<SearchHit[]> {
    const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    // A food found online carries no group (MM-616), so it is in none.
    if (words.length === 0 || group !== undefined) return [];
    const hits: SearchHit[] = [];
    for (const { food } of this.entries.values()) {
      const name = food.name.toLowerCase();
      const brand = (food.brand ?? '').toLowerCase();
      if (!words.every((w) => name.includes(w) || brand.includes(w))) continue;
      hits.push({ food, score: words.reduce((sum, w) => sum + (name.startsWith(w) ? 0 : 1), 0) - 100 });
    }
    return hits.sort((a, b) => a.score - b.score || a.food.name.localeCompare(b.food.name)).slice(offset, offset + limit);
  }

  async byBarcode(gtin14: string): Promise<CatalogFood | undefined> {
    for (const entry of this.entries.values()) if (entry.barcodes?.[0] === gtin14) return entry.food;
    return undefined;
  }

  async pairOf(): Promise<CatalogFood | undefined> {
    return undefined;
  }

  async foodById(packId: string, foodId: number): Promise<CatalogFood | undefined> {
    return packId === onlinePackId ? this.entries.get(foodId)?.food : undefined;
  }

  async servingsOf(food: CatalogFood): Promise<CatalogServing[]> {
    if (food.packId !== onlinePackId) return [];
    return [...(this.entries.get(food.id)?.servings ?? [])];
  }
}
