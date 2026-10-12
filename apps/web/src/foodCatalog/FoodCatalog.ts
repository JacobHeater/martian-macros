import type { CatalogBarcodeLookup } from './CatalogBarcodeLookup';
import type { CatalogFood } from './CatalogFood';
import type { CatalogPairLookup } from './CatalogPairLookup';
import type { CatalogSearch } from './CatalogSearch';
import type { CatalogServing } from './CatalogServing';
import type { CatalogServingLookup } from './CatalogServingLookup';
import type { FoodPack } from './FoodPack';
import type { SearchHit } from './SearchHit';
import { TrustTier } from './TrustTier';

/**
 * Reference foods before label foods before "check this" ones, then the
 * better text match (MM-42, MM-153). So a generic "Oats" lists above a
 * branded product that merely matches the word more tightly.
 */
function byTrustThenMatch(a: SearchHit, b: SearchHit): number {
  const byTier = TrustTier.code(a.food.tier) - TrustTier.code(b.food.tier);
  return byTier !== 0 ? byTier : a.score - b.score;
}

/**
 * Several installed packs presented as one: search returns one ranked list,
 * and a barcode is looked up in each pack in turn.
 */
export class FoodCatalog implements CatalogSearch, CatalogBarcodeLookup, CatalogServingLookup, CatalogPairLookup {
  readonly packs: readonly FoodPack[];

  constructor(packs: readonly FoodPack[]) {
    this.packs = packs;
  }

  async search(query: string, { limit = 25, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<SearchHit[]> {
    const hits: SearchHit[] = [];
    for (const pack of this.packs) {
      hits.push(...(await pack.search(query, { limit: limit + offset })));
    }
    return hits.sort(byTrustThenMatch).slice(offset, offset + limit);
  }

  async byBarcode(gtin14: string): Promise<CatalogFood | undefined> {
    for (const pack of this.packs) {
      const food = await pack.byBarcode(gtin14);
      if (food !== undefined) return food;
    }
    return undefined;
  }

  async pairOf(food: CatalogFood): Promise<CatalogFood | undefined> {
    for (const pack of this.packs) {
      if (pack.packId === food.packId) return pack.pairOf(food);
    }
    return undefined;
  }

  async servingsOf(food: CatalogFood): Promise<CatalogServing[]> {
    for (const pack of this.packs) {
      if (pack.packId === food.packId) return pack.servingsOf(food);
    }
    return [];
  }
}
