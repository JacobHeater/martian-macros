import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it } from 'vitest';
import type { ConflictPolicy } from '../../src/foodPipeline/ConflictPolicy';
import { MostRecentPolicy } from '../../src/foodPipeline/MostRecentPolicy';
import { readBuildProvenance } from '../../src/foodPipeline/node/readBuildProvenance';
import { readExtract } from '../../src/foodPipeline/node/readExtract';
import { writePacks } from '../../src/foodPipeline/node/writePacks';
import { PackBuilder } from '../../src/foodPipeline/PackBuilder';
import { PreferredSourcePolicy } from '../../src/foodPipeline/PreferredSourcePolicy';
import { WasmSqlDatabase } from '../../src/sql/wasm/WasmSqlDatabase';
import recorded from './support/dartBuild.json';

/**
 * MM-230: the pipeline builds what the Dart pipeline built. `extract/` is
 * 230 invented candidates (shared barcodes, older versions, bad check
 * digits, missing and impossible values, raw and cooked names), and
 * `dartBuild.json` is what the Dart package made of them on 2026-10-12
 * under each conflict rule: its report, and every row of both packs.
 */
const extract = 'test/foodPipeline/support/extract';
const out = mkdtempSync(join(tmpdir(), 'parity-'));
afterAll(() => rmSync(out, { recursive: true, force: true }));

const policies: Record<keyof typeof recorded, ConflictPolicy> = {
  recent: new MostRecentPolicy({ tieBreak: 'off' }),
  off: new PreferredSourcePolicy('off'),
  usda_branded: new PreferredSourcePolicy('usda_branded'),
};

async function rowsOf(path: string) {
  const db = await WasmSqlDatabase.open({ bytes: new Uint8Array(readFileSync(path)) });
  const rows = async (sql: string) => (await db.select(sql)).map((row) => Object.values(row));
  const dump = {
    header: await rows('SELECT key, value FROM header ORDER BY key'),
    foods: await rows('SELECT * FROM foods ORDER BY id'),
    servings: await rows('SELECT food_id, description, grams FROM servings ORDER BY rowid'),
    barcodes: await rows('SELECT gtin, food_id FROM barcodes ORDER BY gtin'),
  };
  await db.close();
  return dump;
}

for (const [prefer, policy] of Object.entries(policies) as [keyof typeof recorded, ConflictPolicy][]) {
  it(`preferring ${prefer}: the same report and the same rows in both packs as Dart`, async () => {
    const dir = join(out, prefer);
    const result = await new PackBuilder({ policy }).build(readExtract(extract));
    await writePacks(result, readBuildProvenance(join(extract, 'provenance.json')), dir);

    const dart = recorded[prefer];
    expect(readFileSync(join(dir, 'report.txt'), 'utf8')).toBe(dart.report);
    expect(dart.packs.generic.foods.length).toBe(46);
    expect(dart.packs.barcode_us.foods.length).toBe(96);
    expect(await rowsOf(join(dir, 'generic.pack'))).toEqual(dart.packs.generic);
    expect(await rowsOf(join(dir, 'barcode_us.pack'))).toEqual(dart.packs.barcode_us);
  });
}
