import { FoodCatalog } from '../FoodCatalog';
import type { FoodPack } from '../FoodPack';
import { SqliteFoodPack } from '../SqliteFoodPack';
import type { PackStore } from './PackStore';

/**
 * The installed packs read as one catalog (MM-42). Empty until a pack is
 * installed; search then has nothing to find and the sheet says so. A pack
 * that will not open is skipped, not fatal to search.
 */
export async function openInstalledCatalog(store: PackStore): Promise<FoodCatalog> {
  const packs: FoodPack[] = [];
  for (const installed of await store.installed()) {
    try {
      packs.push(await SqliteFoodPack.open(await store.open(installed)));
    } catch {
      // Skipped: the others still answer.
    }
  }
  return new FoodCatalog(packs);
}
