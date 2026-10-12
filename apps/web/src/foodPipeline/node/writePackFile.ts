import { writeFileSync } from 'node:fs';
import type { FoodPackHeader } from '../../foodCatalog/FoodPackHeader';
import type { PackEntry } from '../../foodCatalog/PackEntry';
import { writeFoodPack } from '../../foodCatalog/writeFoodPack';
import { WasmSqlDatabase } from '../../sql/wasm/WasmSqlDatabase';

/**
 * Writes a pack to the file at `path`. The pack is built in memory and
 * then written out whole, so it has to fit in memory.
 */
export async function writePackFile(path: string, header: FoodPackHeader, entries: readonly PackEntry[]): Promise<void> {
  const db = await WasmSqlDatabase.open();
  try {
    await writeFoodPack(db, header, entries);
    writeFileSync(path, await db.exportBytes());
  } finally {
    await db.close();
  }
}
