import type { FoodGroup } from '../../domain/food/FoodGroup';
import { FormatError } from '../../lang/FormatError';
import type { SqlDatabase } from '../../sql/SqlDatabase';
import type { SqlRow } from '../../sql/SqlRow';
import type { SqlValue } from '../../sql/SqlValue';
import { CatalogFood } from '../CatalogFood';
import type { CatalogServing } from '../CatalogServing';
import type { PackEntry } from '../PackEntry';
import type { PackMicros } from '../PackMicros';
import type { SearchHit } from '../SearchHit';
import { TrustTier } from '../TrustTier';
import type { OnlineFoodCache } from './OnlineFoodCache';
import { onlineFoodRow } from './onlineFoodRow';
import { onlinePackId } from './onlinePackId';

const table = 'online_foods';

function number(value: SqlValue | undefined, column: string): number {
  if (typeof value !== 'number') throw new FormatError(`The online food's ${column} is not a number.`);
  return value;
}

function text(value: SqlValue | undefined, column: string): string {
  if (typeof value !== 'string') throw new FormatError(`The online food's ${column} is not text.`);
  return value;
}

const optionalNumber = (value: SqlValue | undefined) => (typeof value === 'number' ? value : undefined);
const optionalText = (value: SqlValue | undefined) => (typeof value === 'string' ? value : undefined);

/**
 * The online food cache in the user's database (MM-58), table `online_foods`
 * (schema version 12). The cache is small, so search is a plain match of
 * every typed word against the name and brand.
 */
export class SqlOnlineFoodCache implements OnlineFoodCache {
  private readonly db: SqlDatabase;
  readonly packId = onlinePackId;

  constructor(db: SqlDatabase) {
    this.db = db;
  }

  async remember(entry: PackEntry): Promise<CatalogFood> {
    const row = onlineFoodRow(entry);
    const columns = Object.keys(row);
    const values = Object.values(row);
    const gtin = row['gtin'] ?? null;
    const source = row['source'] ?? '';
    const sourceId = row['source_id'] ?? null;
    const id = await this.db.transaction(async (inside) => {
      // One record per barcode, and one per source record: the newer answer replaces the older.
      if (gtin !== null) await inside.execute(`DELETE FROM ${table} WHERE gtin = ?`, [gtin]);
      if (sourceId !== null) await inside.execute(`DELETE FROM ${table} WHERE source = ? AND source_id = ?`, [source, sourceId]);
      await inside.execute(
        `INSERT INTO ${table} (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
        values,
      );
      return number((await inside.select('SELECT last_insert_rowid() AS id'))[0]?.['id'], 'id');
    });
    const kept = (await this.db.select(`SELECT * FROM ${table} WHERE id = ?`, [id]))[0];
    if (kept === undefined) throw new FormatError('The online food was not kept.');
    return this.food(kept);
  }

  async count(): Promise<number> {
    return number((await this.db.select(`SELECT count(*) AS n FROM ${table}`))[0]?.['n'], 'count');
  }

  async clear(): Promise<void> {
    await this.db.execute(`DELETE FROM ${table}`);
  }

  async search(
    query: string,
    { limit = 25, offset = 0, group }: { limit?: number; offset?: number; group?: FoodGroup | undefined } = {},
  ): Promise<SearchHit[]> {
    const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    // A food found online carries no group (MM-616), so it is in none.
    if (words.length === 0 || group !== undefined) return [];
    const where = words.map(() => "(lower(name) LIKE ? OR lower(coalesce(brand, '')) LIKE ?)").join(' AND ');
    const params = words.flatMap((w) => [`%${w}%`, `%${w}%`]);
    const rows = await this.db.select(`SELECT * FROM ${table} WHERE ${where} ORDER BY name, id LIMIT ? OFFSET ?`, [
      ...params,
      limit,
      offset,
    ]);
    // A word at the start of the name is the better match; a score like a pack's, lower is better.
    return rows.map((row) => {
      const food = this.food(row);
      const name = food.name.toLowerCase();
      const score = words.reduce((sum, w) => sum + (name.startsWith(w) ? 0 : 1), 0) - 100;
      return { food, score };
    });
  }

  async byBarcode(gtin14: string): Promise<CatalogFood | undefined> {
    const row = (await this.db.select(`SELECT * FROM ${table} WHERE gtin = ?`, [gtin14]))[0];
    return row === undefined ? undefined : this.food(row);
  }

  async pairOf(): Promise<CatalogFood | undefined> {
    return undefined;
  }

  async foodById(packId: string, foodId: number): Promise<CatalogFood | undefined> {
    if (packId !== onlinePackId) return undefined;
    const row = (await this.db.select(`SELECT * FROM ${table} WHERE id = ?`, [foodId]))[0];
    return row === undefined ? undefined : this.food(row);
  }

  async servingsOf(food: CatalogFood): Promise<CatalogServing[]> {
    if (food.packId !== onlinePackId) return [];
    const row = (await this.db.select(`SELECT servings FROM ${table} WHERE id = ?`, [food.id]))[0];
    return row === undefined ? [] : servingsOf(text(row['servings'], 'servings'));
  }

  private food(row: SqlRow): CatalogFood {
    return new CatalogFood({
      id: number(row['id'], 'id'),
      packId: onlinePackId,
      name: text(row['name'], 'name'),
      brand: optionalText(row['brand']),
      kcal: number(row['kcal'], 'kcal'),
      proteinG: number(row['protein_g'], 'protein'),
      carbsG: number(row['carbs_g'], 'carbohydrate'),
      fatG: number(row['fat_g'], 'fat'),
      fiberG: optionalNumber(row['fiber_g']),
      sugarAlcoholsG: optionalNumber(row['sugar_alcohols_g']),
      sodiumMg: optionalNumber(row['sodium_mg']),
      alcoholG: optionalNumber(row['alcohol_g']),
      micros: microsOf(text(row['micros'], 'micros')),
      source: text(row['source'], 'source'),
      sourceId: optionalText(row['source_id']),
      tier: TrustTier.fromCode(number(row['tier'], 'tier')),
      tierReason: text(row['tier_reason'], 'tier reason'),
    });
  }
}

function microsOf(json: string): PackMicros {
  const parsed: unknown = JSON.parse(json);
  const micros: Record<string, number> = {};
  if (typeof parsed === 'object' && parsed !== null) {
    for (const [key, value] of Object.entries(parsed)) if (typeof value === 'number') micros[key] = value;
  }
  return micros as PackMicros;
}

function servingsOf(json: string): CatalogServing[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item: unknown) => {
    if (typeof item !== 'object' || item === null) return [];
    const { description, grams } = item as { description?: unknown; grams?: unknown };
    return typeof description === 'string' && typeof grams === 'number' && grams > 0 ? [{ description, grams }] : [];
  });
}
