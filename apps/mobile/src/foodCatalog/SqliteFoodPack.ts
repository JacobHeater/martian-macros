import { FoodGroup } from '../domain/food/FoodGroup';
import { FormatError } from '../lang/FormatError';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlRow } from '../sql/SqlRow';
import type { SqlValue } from '../sql/SqlValue';
import { CatalogFood } from './CatalogFood';
import type { CatalogServing } from './CatalogServing';
import type { FoodPack } from './FoodPack';
import { FoodPackFormat } from './FoodPackFormat';
import type { FoodPackHeader } from './FoodPackHeader';
import { PackMicronutrient } from './PackMicronutrient';
import type { PackMicros } from './PackMicros';
import { PreparationState } from './PreparationState';
import type { SearchHit } from './SearchHit';
import { TrustTier } from './TrustTier';
import { UnsupportedPackVersion } from './UnsupportedPackVersion';

const formatOneColumns =
  'f.id, f.name, f.brand, f.kcal, f.protein, f.carbs, f.fat, f.fiber, ' +
  'f.sodium_mg, f.alcohol, f.preparation, f.pair_id, f.density, ' +
  'f.source, f.source_id, f.tier, f.tier_reason';

function number(value: SqlValue | undefined, column: string): number {
  if (typeof value !== 'number') throw new FormatError(`The pack's ${column} is not a number.`);
  return value;
}

function text(value: SqlValue | undefined, column: string): string {
  if (typeof value !== 'string') throw new FormatError(`The pack's ${column} is not text.`);
  return value;
}

const optionalNumber = (value: SqlValue | undefined) => (typeof value === 'number' ? value : undefined);
const optionalText = (value: SqlValue | undefined) => (typeof value === 'string' ? value : undefined);

/** One installed pack file, read through an open database. */
export class SqliteFoodPack implements FoodPack {
  private readonly db: SqlDatabase;
  readonly header: FoodPackHeader;

  private constructor(db: SqlDatabase, header: FoodPackHeader) {
    this.db = db;
    this.header = header;
  }

  /**
   * Reads the pack in `db`, which the platform opened read-only. Throws
   * `UnsupportedPackVersion` for a format this code does not know, so it is
   * refused and never misread. The database is closed if it turns out not
   * to be a pack.
   */
  static async open(db: SqlDatabase): Promise<SqliteFoodPack> {
    try {
      const version = number((await db.select('PRAGMA user_version'))[0]?.['user_version'], 'format version');
      if (version < FoodPackFormat.oldestReadable || version > FoodPackFormat.version) {
        throw new UnsupportedPackVersion({ found: version, supported: FoodPackFormat.version });
      }
      const values = new Map<string, string>();
      for (const row of await db.select('SELECT key, value FROM header')) {
        values.set(text(row['key'], 'header key'), text(row['value'], 'header value'));
      }
      const header = (key: string) => text(values.get(key), `header "${key}"`);
      const sources: unknown = JSON.parse(header('sources'));
      if (!Array.isArray(sources) || !sources.every((source) => typeof source === 'string')) {
        throw new FormatError("The pack's sources are not a list of names.");
      }
      return new SqliteFoodPack(db, {
        packId: header('pack_id'),
        formatVersion: version,
        builtOn: header('built_on'),
        region: header('region'),
        sources,
        license: header('license'),
        attribution: header('attribution'),
      });
    } catch (error) {
      await db.close(); // never leave a file open that turned out not to be a pack
      throw error;
    }
  }

  get packId(): string {
    return this.header.packId;
  }

  async search(
    query: string,
    { limit = 25, offset = 0, group }: { limit?: number; offset?: number; group?: FoodGroup | undefined } = {},
  ): Promise<SearchHit[]> {
    const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    // A pack older than format 4 holds no groups, so none of its foods is in one (MM-616).
    if (group !== undefined && this.header.formatVersion < 4) return [];
    if (words.length === 0) {
      if (group === undefined) return [];
      const listed = await this.db.select(
        `SELECT ${this.columns}, 0 AS score FROM foods f WHERE f.food_group = ? ORDER BY f.id LIMIT ? OFFSET ?`,
        [group, limit, offset],
      );
      return listed.map((row) => ({ food: this.food(row), score: number(row['score'], 'score') }));
    }
    const match = words.map((w) => `"${w}"*`).join(' ');
    const inGroup = group === undefined ? '' : 'AND f.food_group = ? ';
    const rows = await this.db.select(
      `SELECT ${this.columns}, bm25(foods_fts, 10.0, 1.0) AS score ` +
        'FROM foods_fts JOIN foods f ON f.id = foods_fts.rowid ' +
        `WHERE foods_fts MATCH ? ${inGroup}ORDER BY score, f.id LIMIT ? OFFSET ?`,
      group === undefined ? [match, limit, offset] : [match, group, limit, offset],
    );
    return rows.map((row) => ({ food: this.food(row), score: number(row['score'], 'score') }));
  }

  async byBarcode(gtin14: string): Promise<CatalogFood | undefined> {
    const rows = await this.db.select(
      `SELECT ${this.columns} FROM barcodes b JOIN foods f ON f.id = b.food_id WHERE b.gtin = ?`,
      [gtin14],
    );
    const row = rows[0];
    return row === undefined ? undefined : this.food(row);
  }

  async pairOf(food: CatalogFood): Promise<CatalogFood | undefined> {
    const pairId = food.pairedFoodId;
    if (pairId === undefined || food.packId !== this.header.packId) return undefined;
    const rows = await this.db.select(`SELECT ${this.columns} FROM foods f WHERE f.id = ?`, [pairId]);
    const row = rows[0];
    return row === undefined ? undefined : this.food(row);
  }

  async foodById(packId: string, foodId: number): Promise<CatalogFood | undefined> {
    if (packId !== this.header.packId) return undefined;
    const rows = await this.db.select(`SELECT ${this.columns} FROM foods f WHERE f.id = ?`, [foodId]);
    const row = rows[0];
    return row === undefined ? undefined : this.food(row);
  }

  async servingsOf(food: CatalogFood): Promise<CatalogServing[]> {
    if (food.packId !== this.header.packId) return [];
    const rows = await this.db.select('SELECT description, grams FROM servings WHERE food_id = ? ORDER BY rowid', [
      food.id,
    ]);
    return rows.map((row) => ({
      description: text(row['description'], 'serving description'),
      grams: number(row['grams'], 'serving grams') / FoodPackFormat.nutrientScale,
    }));
  }

  close(): Promise<void> {
    return this.db.close();
  }

  /**
   * The columns a food is read from: format 2 adds the micronutrients
   * (MM-307), format 3 sugar alcohols (MM-397), format 4 the food group (MM-616).
   */
  private get columns(): string {
    const version = this.header.formatVersion;
    if (version < 2) return formatOneColumns;
    const micros = [formatOneColumns, ...PackMicronutrient.values.map((n) => `f.${PackMicronutrient.column(n)}`)];
    if (version < 3) return micros.join(', ');
    return [...micros, 'f.sugar_alcohols', ...(version < 4 ? [] : ['f.food_group'])].join(', ');
  }

  /** The micronutrient columns a format 2 pack has; a format 1 pack has none (MM-307). */
  private microsOf(scaledIfStated: (column: string) => number | undefined): PackMicros {
    if (this.header.formatVersion < 2) return {};
    const micros: Partial<Record<PackMicronutrient, number>> = {};
    for (const n of PackMicronutrient.values) {
      const value = scaledIfStated(PackMicronutrient.column(n));
      if (value !== undefined) micros[n] = value;
    }
    return micros;
  }

  private food(row: SqlRow): CatalogFood {
    const scaled = (column: string) => number(row[column], column) / FoodPackFormat.nutrientScale;
    const scaledIfStated = (column: string) => {
      const value = optionalNumber(row[column]);
      return value === undefined ? undefined : value / FoodPackFormat.nutrientScale;
    };
    const density = optionalNumber(row['density']);
    return new CatalogFood({
      id: number(row['id'], 'id'),
      packId: this.header.packId,
      name: text(row['name'], 'name'),
      brand: optionalText(row['brand']),
      kcal: scaled('kcal'),
      proteinG: scaled('protein'),
      carbsG: scaled('carbs'),
      fatG: scaled('fat'),
      micros: this.microsOf(scaledIfStated),
      fiberG: scaledIfStated('fiber'),
      sugarAlcoholsG: this.header.formatVersion < 3 ? undefined : scaledIfStated('sugar_alcohols'),
      sodiumMg: scaledIfStated('sodium_mg'),
      alcoholG: scaledIfStated('alcohol'),
      preparation: PreparationState.fromCode(number(row['preparation'], 'preparation')),
      pairedFoodId: optionalNumber(row['pair_id']),
      densityGPerMl: density === undefined ? undefined : density / FoodPackFormat.densityScale,
      source: text(row['source'], 'source'),
      sourceId: optionalText(row['source_id']),
      tier: TrustTier.fromCode(number(row['tier'], 'tier')),
      tierReason: text(row['tier_reason'], 'tier reason'),
      // A group this code does not know is no group, never a misread one.
      group: this.header.formatVersion < 4 ? undefined : FoodGroup.fromName(optionalText(row['food_group'])),
    });
  }
}
