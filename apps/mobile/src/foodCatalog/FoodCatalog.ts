import type { CatalogBarcodeLookup } from './CatalogBarcodeLookup';
import type { CatalogFood } from './CatalogFood';
import type { CatalogFoodLookup } from './CatalogFoodLookup';
import type { CatalogPairLookup } from './CatalogPairLookup';
import type { CatalogSearch } from './CatalogSearch';
import type { CatalogServing } from './CatalogServing';
import type { CatalogServingLookup } from './CatalogServingLookup';
import type { FoodPack } from './FoodPack';
import { onlinePackId } from './online/onlinePackId';
import type { SearchHit } from './SearchHit';
import { sourceReliability } from './sourceReliability';

/**
 * The more reliable source first, then the better text match (MM-42,
 * MM-153, MM-383). So a generic "Oats" from an analysed database lists
 * above a crowd-entered product that merely matches the word more tightly.
 */
function byReliabilityThenMatch(a: SearchHit, b: SearchHit): number {
  const byScore = sourceReliability(b.food) - sourceReliability(a.food);
  return byScore !== 0 ? byScore : a.score - b.score;
}

/**
 * Several installed packs presented as one: search returns one ranked list,
 * and a barcode takes the most reliable record across the packs (MM-383),
 * the tie going to the pack listed first.
 *
 * `owned` are the handles this catalog opened and closes with `close`
 * (MM-386): the pack files, never a pack it was lent, such as the foods
 * found online, which live in the user's own database.
 */
export class FoodCatalog implements CatalogSearch, CatalogBarcodeLookup, CatalogServingLookup, CatalogPairLookup, CatalogFoodLookup {
  readonly packs: readonly FoodPack[];
  private readonly owned: readonly { close(): Promise<void> }[];
  private closing: Promise<void> | undefined;

  constructor(packs: readonly FoodPack[], owned: readonly { close(): Promise<void> }[] = []) {
    this.packs = packs;
    this.owned = owned;
  }

  /**
   * Closes the handles this catalog opened (MM-386). It is not read
   * afterwards; closing twice closes once. One that will not close does not
   * keep the others open.
   */
  close(): Promise<void> {
    this.closing ??= Promise.allSettled(this.owned.map((handle) => handle.close())).then(() => undefined);
    return this.closing;
  }

  /** The packs that are files on the phone: without one, search has nothing to find but what was found online (MM-58). */
  get installedPacks(): readonly FoodPack[] {
    return this.packs.filter((pack) => pack.packId !== onlinePackId);
  }

  async search(query: string, { limit = 25, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<SearchHit[]> {
    const hits: SearchHit[] = [];
    for (const pack of this.packs) {
      hits.push(...(await pack.search(query, { limit: limit + offset })));
    }
    return hits.sort(byReliabilityThenMatch).slice(offset, offset + limit);
  }

  async byBarcode(gtin14: string): Promise<CatalogFood | undefined> {
    let best: CatalogFood | undefined;
    for (const pack of this.packs) {
      const food = await pack.byBarcode(gtin14);
      if (food !== undefined && (best === undefined || sourceReliability(food) > sourceReliability(best))) best = food;
    }
    return best;
  }

  async pairOf(food: CatalogFood): Promise<CatalogFood | undefined> {
    for (const pack of this.packs) {
      if (pack.packId === food.packId) return pack.pairOf(food);
    }
    return undefined;
  }

  async foodById(packId: string, foodId: number): Promise<CatalogFood | undefined> {
    for (const pack of this.packs) {
      if (pack.packId === packId) return pack.foodById(packId, foodId);
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
