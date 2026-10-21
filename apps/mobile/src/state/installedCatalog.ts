import { openInstalledCatalog } from '../foodCatalog/download/openInstalledCatalog';
import type { PackStore } from '../foodCatalog/download/PackStore';
import type { FoodCatalog } from '../foodCatalog/FoodCatalog';
import type { FoodPack } from '../foodCatalog/FoodPack';
import type { Watched } from '../lang/Watched';
import { reopenEach } from './reopenEach';

/**
 * The packs installed in `store`, with `also`, as one catalog read again on
 * each subscription (the app asks again when a pack is installed or
 * removed), and each catalog it replaces closed, so no pack is left open
 * natively (MM-386).
 */
export function installedCatalog(store: PackStore, also: readonly FoodPack[] = []): Watched<FoodCatalog> {
  return reopenEach(
    () => openInstalledCatalog(store, also),
    (catalog) => catalog.close(),
  );
}
