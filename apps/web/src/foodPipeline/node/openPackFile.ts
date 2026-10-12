import { readFileSync } from 'node:fs';
import { SqliteFoodPack } from '../../foodCatalog/SqliteFoodPack';
import { WasmSqlDatabase } from '../../sql/wasm/WasmSqlDatabase';

/**
 * The pack in the file at `path`. It is read into memory, so nothing done
 * to it can change the file.
 */
export async function openPackFile(path: string): Promise<SqliteFoodPack> {
  return SqliteFoodPack.open(await WasmSqlDatabase.open({ bytes: new Uint8Array(readFileSync(path)) }));
}
