import { FixturePack } from '../../src/foodCatalog/FixturePack';
import { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import type { FoodPackHeader } from '../../src/foodCatalog/FoodPackHeader';
import type { PackEntry } from '../../src/foodCatalog/PackEntry';
import { SqliteFoodPack } from '../../src/foodCatalog/SqliteFoodPack';
import { writeFoodPack } from '../../src/foodCatalog/writeFoodPack';
import { constant } from '../../src/lang/constant';
import type { AppServices } from '../../src/state/AppServices';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';

/** A catalog of one pack written in memory: the fixture pack unless another is given. */
export async function fixtureCatalog(
  header: FoodPackHeader = FixturePack.header,
  entries: readonly PackEntry[] = FixturePack.entries,
): Promise<FoodCatalog> {
  const db = await WasmSqlDatabase.open();
  await writeFoodPack(db, header, entries);
  return new FoodCatalog([await SqliteFoodPack.open(db)]);
}

/** For `renderApp`'s `change`: the app with `catalog` as its installed food packs. */
export const withCatalog =
  (catalog: FoodCatalog) =>
  (services: AppServices): AppServices => ({ ...services, catalog: constant(catalog) });
