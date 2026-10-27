import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { StateError } from '../lang/StateError';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlValue } from '../sql/SqlValue';
import { CatalogBasis } from './CatalogBasis';
import { FoodPackFormat } from './FoodPackFormat';
import type { FoodPackHeader } from './FoodPackHeader';
import type { PackEntry } from './PackEntry';
import { PackMicronutrient } from './PackMicronutrient';
import { PreparationState } from './PreparationState';
import { TrustTier } from './TrustTier';

const scaled = (value: number | undefined) =>
  value === undefined ? null : roundHalfAwayFromZero(value * FoodPackFormat.nutrientScale);

async function insertAll(db: SqlDatabase, sql: string, rows: readonly (readonly SqlValue[])[]): Promise<void> {
  for (const row of rows) await db.execute(sql, row);
}

/**
 * Writes a pack into `db`, which must be new and empty. The pipeline
 * (MM-52) and the test fixture use it, so the format is defined once. What
 * the database is, a file on disk or bytes in memory, is the caller's.
 */
export async function writeFoodPack(db: SqlDatabase, header: FoodPackHeader, entries: readonly PackEntry[]): Promise<void> {
  await db.executeScript(FoodPackFormat.schema);
  await db.transaction(async (inside) => {
    const headerValues: readonly (readonly [string, string])[] = [
      ['pack_id', header.packId],
      ['built_on', header.builtOn],
      ['region', header.region],
      ['sources', JSON.stringify(header.sources)],
      ['license', header.license],
      ['attribution', header.attribution],
    ];
    await insertAll(inside, 'INSERT INTO header (key, value) VALUES (?, ?)', headerValues);

    const foods: SqlValue[][] = [];
    const servings: SqlValue[][] = [];
    const barcodes: SqlValue[][] = [];
    for (const e of entries) {
      const f = e.food;
      foods.push([
        f.id,
        f.name,
        f.brand ?? null,
        scaled(f.kcal),
        scaled(f.proteinG),
        scaled(f.carbsG),
        scaled(f.fatG),
        scaled(f.fiberG),
        scaled(f.sodiumMg),
        scaled(f.alcoholG),
        PreparationState.code(f.preparation),
        f.pairedFoodId ?? null,
        f.densityGPerMl === undefined ? null : roundHalfAwayFromZero(f.densityGPerMl * FoodPackFormat.densityScale),
        f.source,
        f.sourceId ?? null,
        TrustTier.code(f.tier),
        f.tierReason,
        ...PackMicronutrient.values.map((n) => scaled(f.micros[n])),
        scaled(f.sugarAlcoholsG),
        f.group ?? null,
        CatalogBasis.code(f.basis),
      ]);
      for (const s of e.servings ?? []) {
        // A serving is a weight, a volume or both (MM-650); one with neither is a bug in the caller, not a row.
        if (!((s.grams ?? 0) > 0) && !((s.milliliters ?? 0) > 0)) {
          throw new StateError(`Serving "${s.description}" of ${f.name} has neither grams nor millilitres.`);
        }
        servings.push([f.id, s.description, scaled(s.grams), scaled(s.milliliters)]);
      }
      for (const b of e.barcodes ?? []) barcodes.push([b, f.id]);
    }
    const micros = PackMicronutrient.values.map((n) => PackMicronutrient.column(n));
    await insertAll(
      inside,
      'INSERT INTO foods (id, name, brand, kcal, protein, carbs, fat, fiber, ' +
        'sodium_mg, alcohol, preparation, pair_id, density, source, source_id, ' +
        `tier, tier_reason, ${micros.join(', ')}, sugar_alcohols, food_group, basis) ` +
        `VALUES (${Array.from({ length: 20 + micros.length }, () => '?').join(', ')})`,
      foods,
    );
    await insertAll(inside, 'INSERT INTO servings (food_id, description, grams, milliliters) VALUES (?, ?, ?, ?)', servings);
    await insertAll(inside, 'INSERT INTO barcodes (gtin, food_id) VALUES (?, ?)', barcodes);
    await inside.execute("INSERT INTO foods_fts(foods_fts) VALUES ('rebuild')");
  });
  await db.execute(`PRAGMA user_version = ${FoodPackFormat.version}`);
}
