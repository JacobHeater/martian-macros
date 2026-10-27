import { FoodGroup } from '../domain/food/FoodGroup';
import { FormatError } from '../lang/FormatError';
import type { SqlDatabase } from '../sql/SqlDatabase';
import type { SqlRow } from '../sql/SqlRow';
import type { SqlValue } from '../sql/SqlValue';
import { CatalogBasis } from './CatalogBasis';
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

/** How many first letters of a mistyped word are kept to find what it meant (MM-638). */
const stemLength = 4;

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
    {
      limit = 25,
      offset = 0,
      group,
      closest = false,
    }: { limit?: number; offset?: number; group?: FoodGroup | undefined; closest?: boolean | undefined } = {},
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
    const terms = words.map((w) => `"${w}"*`);
    const found = await this.matching(terms.join(' '), { limit, offset, group });
    if (!closest || found.length > 0 || offset > 0) return found;
    // Every word typed found nothing: the closest foods, said as such (MM-627), tried in turn.
    const partial = (hits: SearchHit[]) => hits.map((hit) => ({ ...hit, partial: true }));
    // A word mistyped after its first letters ("chickn"): every word by its first four (MM-638).
    const stems = words.map((w) => `"${w.length > stemLength ? w.slice(0, stemLength) : w}"*`);
    const stemmed = stems.some((stem, i) => stem !== terms[i]);
    if (stemmed) {
      const near = await this.matching(stems.join(' '), { limit, offset, group });
      if (near.length > 0) return partial(near);
    }
    if (words.length < 2) return [];
    // Some of the words typed (MM-627), then some of them by their first letters (MM-638).
    const some = await this.matching(terms.join(' OR '), { limit, offset, group });
    if (some.length > 0 || !stemmed) return partial(some);
    return partial(await this.matching(stems.join(' OR '), { limit, offset, group }));
  }

  /** The foods `match` finds, best text score first, each with its first serving (MM-627). */
  private async matching(
    match: string,
    { limit, offset, group }: { limit: number; offset: number; group: FoodGroup | undefined },
  ): Promise<SearchHit[]> {
    const inGroup = group === undefined ? '' : 'AND f.food_group = ? ';
    const first = (column: string) => `(SELECT s.${column} FROM servings s WHERE s.food_id = f.id ORDER BY s.rowid LIMIT 1)`;
    // A pack older than format 5 has no serving volumes (MM-650).
    const firstMl = this.header.formatVersion < 5 ? 'NULL' : first('milliliters');
    const rows = await this.db.select(
      `SELECT ${this.columns}, bm25(foods_fts, 10.0, 1.0) AS score, ${first('description')} AS first_serving, ` +
        `${first('grams')} AS first_serving_grams, ${firstMl} AS first_serving_ml ` +
        'FROM foods_fts JOIN foods f ON f.id = foods_fts.rowid ' +
        `WHERE foods_fts MATCH ? ${inGroup}ORDER BY score, f.id LIMIT ? OFFSET ?`,
      group === undefined ? [match, limit, offset] : [match, group, limit, offset],
    );
    return rows.map((row) => {
      const description = row['first_serving'];
      return {
        food: this.food(row),
        score: number(row['score'], 'score'),
        firstServing:
          typeof description === 'string'
            ? this.serving(description, row['first_serving_grams'], row['first_serving_ml'])
            : undefined,
      };
    });
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
    const milliliters = this.header.formatVersion < 5 ? 'NULL AS milliliters' : 'milliliters';
    const rows = await this.db.select(`SELECT description, grams, ${milliliters} FROM servings WHERE food_id = ? ORDER BY rowid`, [
      food.id,
    ]);
    return rows.map((row) => this.serving(text(row['description'], 'serving description'), row['grams'], row['milliliters']));
  }

  /**
   * A serving as the pack holds it: a weight, a volume (format 5, MM-650) or
   * both, each stored times the nutrient scale. A serving with neither is a
   * malformed pack, never a serving of nothing.
   */
  private serving(description: string, grams: SqlValue | undefined, milliliters: SqlValue | undefined): CatalogServing {
    const g = optionalNumber(grams);
    const ml = optionalNumber(milliliters);
    if (g === undefined && ml === undefined) throw new FormatError(`The pack's serving "${description}" has neither grams nor millilitres.`);
    return {
      description,
      grams: g === undefined ? undefined : g / FoodPackFormat.nutrientScale,
      milliliters: ml === undefined ? undefined : ml / FoodPackFormat.nutrientScale,
    };
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
    return [...micros, 'f.sugar_alcohols', ...(version < 4 ? [] : ['f.food_group']), ...(version < 5 ? [] : ['f.basis'])].join(', ');
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
      // A pack older than format 5 is per 100 g throughout (MM-650).
      basis: this.header.formatVersion < 5 ? 'per100g' : CatalogBasis.fromCode(optionalText(row['basis'])),
    });
  }
}
