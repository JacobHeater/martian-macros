import { FoodGroup } from '../domain/food/FoodGroup';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import { PackMicronutrient } from '../foodCatalog/PackMicronutrient';
import { compareStrings } from '../lang/compareStrings';
import { categoryKey } from './categoryKey';
import type { DropReason } from './DropReason';
import { foodGroupByCategory } from './foodGroupByCategory';

const sum = (counts: Iterable<number>) => [...counts].reduce((a, b) => a + b, 0);

/**
 * The ten vitamins and minerals the grade counts and how many it needs
 * stated (`engine/GradeMicronutrient`, `FoodGradeRule.micronutrientsMinStated`),
 * repeated here because the pipeline does not import the engine; a test
 * holds them equal.
 */
const GradeMicronutrient = { values: ['potassium', 'calcium', 'iron', 'magnesium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12', 'folate'] as const };
const FoodGradeRule = { micronutrientsMinStated: 4, minKcalPer100g: 10, alcoholLimitG: 1.2 } as const;

/** The sources whose records define all thirteen nutrients, so a low share means an id or a unit slipped (the panel's IN-12). */
const referenceSources = new Set(['usda_foundation', 'usda_sr_legacy', 'usda_fndds']);
const lowShareBelowPercent = 90;

const statedMicros = (f: CatalogFood) => GradeMicronutrient.values.filter((n) => f.micros[n] !== undefined).length;

/**
 * What the grade needs of a food, as rows of the coverage file (MM-383, the
 * panel's IN-5): the publish gate reads these per pack and per source.
 */
const readiness = {
  fiber: (f: CatalogFood) => f.fiberG !== undefined,
  sodium: (f: CatalogFood) => f.sodiumMg !== undefined,
  'fiber and sodium': (f: CatalogFood) => f.fiberG !== undefined && f.sodiumMg !== undefined,
  sugars: (f: CatalogFood) => f.micros.sugars !== undefined,
  'saturated fat': (f: CatalogFood) => f.micros.saturatedFat !== undefined,
  [`at least ${FoodGradeRule.micronutrientsMinStated} of the ${GradeMicronutrient.values.length} vitamins and minerals`]: (f: CatalogFood) =>
    statedMicros(f) >= FoodGradeRule.micronutrientsMinStated,
  [`all ${GradeMicronutrient.values.length} vitamins and minerals`]: (f: CatalogFood) => statedMicros(f) === GradeMicronutrient.values.length,
  'fully gradeable': (f: CatalogFood) =>
    f.fiberG !== undefined &&
    f.sodiumMg !== undefined &&
    f.micros.sugars !== undefined &&
    f.micros.saturatedFat !== undefined &&
    statedMicros(f) >= FoodGradeRule.micronutrientsMinStated &&
    f.kcal >= FoodGradeRule.minKcalPer100g &&
    (f.alcoholG === undefined || f.alcoholG <= FoodGradeRule.alcoholLimitG),
} as const;

/**
 * Counts for one build: what each source gave, what was dropped and why,
 * and what was written. Every entry read is either written or dropped, once.
 * The sources the build expects are listed whether or not they gave
 * anything, and one that gave nothing is a failure (the panel's IN-12).
 */
export class BuildReport {
  readonly read = new Map<string, number>();
  readonly dropped = new Map<string, Map<DropReason, number>>();
  readonly written = new Map<string, number>();

  /** The sources the build was configured with; each must read and write something. */
  readonly expected: readonly string[];

  /**
   * How many written foods state each nutrient, by its pack column, sodium
   * and the micronutrients (MM-307): the coverage MM-306 left unmeasured.
   */
  readonly stating = new Map<string, number>();

  /**
   * The same, per pack and per source (MM-383): the key is `pack/source`,
   * the value counts foods, each column, and each readiness row.
   */
  readonly statingBy = new Map<string, Map<string, number>>();

  /** Generic foods kept over a same-named record that stated more of the grade's inputs (the panel's IN-15). */
  duplicateWinnersSparser = 0;

  /** Written foods by food group (MM-616), a food without one under `none`. */
  readonly groups = new Map<FoodGroup | 'none', number>();

  /**
   * The source categories in no row of the food group table (MM-616), by
   * `source: category`, with how many written foods carry each: their foods
   * have no group until the table names them.
   */
  readonly unmappedCategories = new Map<string, number>();

  /** Written foods whose source gave a category; the groups section is reported only when there are any. */
  private categorised = 0;

  constructor({ expected = [] }: { expected?: readonly string[] } = {}) {
    this.expected = expected;
  }

  /** A written food states the nutrients it has. */
  countStated(food: CatalogFood): void {
    const columns = [
      ...(food.sodiumMg === undefined ? [] : ['sodium_mg']),
      ...PackMicronutrient.values.filter((n) => food.micros[n] !== undefined).map((n) => PackMicronutrient.column(n)),
    ];
    for (const column of columns) this.stating.set(column, (this.stating.get(column) ?? 0) + 1);
    const key = `${food.packId}/${food.source}`;
    let counts = this.statingBy.get(key);
    if (counts === undefined) {
      counts = new Map();
      this.statingBy.set(key, counts);
    }
    counts.set('foods', (counts.get('foods') ?? 0) + 1);
    for (const column of columns) counts.set(column, (counts.get(column) ?? 0) + 1);
    for (const [row, holds] of Object.entries(readiness)) {
      if (holds(food)) counts.set(row, (counts.get(row) ?? 0) + 1);
    }
  }

  /** A written food from `source`, in the source's `category`, was put in `group` (MM-616). */
  countGroup(source: string, category: string | undefined, group: FoodGroup | undefined): void {
    const key = group ?? 'none';
    this.groups.set(key, (this.groups.get(key) ?? 0) + 1);
    if (category === undefined) return;
    this.categorised += 1;
    if (foodGroupByCategory.has(categoryKey(category))) return;
    const unmapped = `${source}: ${category.trim()}`;
    this.unmappedCategories.set(unmapped, (this.unmappedCategories.get(unmapped) ?? 0) + 1);
  }

  countRead(source: string): void {
    this.read.set(source, (this.read.get(source) ?? 0) + 1);
  }

  countDropped(source: string, reason: DropReason): void {
    let bySource = this.dropped.get(source);
    if (bySource === undefined) {
      bySource = new Map();
      this.dropped.set(source, bySource);
    }
    bySource.set(reason, (bySource.get(reason) ?? 0) + 1);
  }

  /** A food written to a pack came from `source`. */
  countWritten(source: string): void {
    this.written.set(source, (this.written.get(source) ?? 0) + 1);
  }

  get totalRead(): number {
    return sum(this.read.values());
  }

  get totalWritten(): number {
    return sum(this.written.values());
  }

  get totalDropped(): number {
    return sum([...this.dropped.values()].flatMap((byReason) => [...byReason.values()]));
  }

  /** Entries read equal entries written plus entries dropped. */
  get reconciles(): boolean {
    return this.totalRead === this.totalWritten + this.totalDropped;
  }

  /** The expected sources that read or wrote nothing: a build with any is not fit to publish. */
  get missingSources(): readonly string[] {
    return this.expected.filter((source) => (this.read.get(source) ?? 0) === 0 || (this.written.get(source) ?? 0) === 0);
  }

  format(): string {
    let out = '';
    const sources = [...new Set([...this.expected, ...this.read.keys()])].sort(compareStrings);
    for (const source of sources) {
      const dropped = this.dropped.get(source) ?? new Map<DropReason, number>();
      const missing = this.missingSources.includes(source) ? '  (MISSING: read or wrote nothing)' : '';
      out +=
        `${source}: read ${this.read.get(source) ?? 0}, written ${this.written.get(source) ?? 0}, ` +
        `dropped ${sum(dropped.values())}${missing}\n`;
      // Most dropped first; reasons dropped equally often stay in the order met.
      const reasons = [...dropped.entries()].sort((a, b) => b[1] - a[1]);
      for (const [reason, count] of reasons) out += `    ${reason}: ${count}\n`;
    }
    out +=
      `total: read ${this.totalRead}, written ${this.totalWritten}, dropped ${this.totalDropped}` +
      `${this.reconciles ? '' : '  (DOES NOT RECONCILE)'}\n`;
    // Only a build run by the tool (with its expected sources) reports the duplicates line, so an older report compares as it did.
    if (this.expected.length > 0) out += `duplicate winners stating fewer of the grade's inputs than their loser: ${this.duplicateWinnersSparser}\n`;
    // Only an extract that carries categories reports the groups (MM-616), so an older report compares as it did.
    if (this.categorised > 0) out += this.formatGroups();
    return out;
  }

  /** Written foods per food group, then every unmapped source category, most foods first (MM-616). */
  private formatGroups(): string {
    let out = 'food groups:\n';
    for (const group of [...FoodGroup.values, 'none' as const]) out += `    ${group}: ${this.groups.get(group) ?? 0}\n`;
    const unmapped = [...this.unmappedCategories.entries()].sort((a, b) => b[1] - a[1] || compareStrings(a[0], b[0]));
    out += `unmapped source categories (no group; add them to foodGroupTable): ${unmapped.length}\n`;
    for (const [category, count] of unmapped) out += `    ${category}: ${count}\n`;
    return out;
  }

  /**
   * How many written foods state each nutrient, and what share of them
   * (MM-307); then the same per pack and per source with the rows the grade
   * needs (MM-383), so the owner can read what the next publish grades. A
   * reference source's row under 90% is marked LOW: those sources define
   * every nutrient, so a low share means an id or a unit slipped.
   */
  formatCoverage(): string {
    let out = 'foods stating each nutrient:\n';
    for (const column of ['sodium_mg', ...PackMicronutrient.values.map((n) => PackMicronutrient.column(n))]) {
      const count = this.stating.get(column) ?? 0;
      const share = this.totalWritten === 0 ? 0 : Math.round((100 * count) / this.totalWritten);
      out += `    ${column}: ${count} (${share}%)\n`;
    }
    for (const key of [...this.statingBy.keys()].sort(compareStrings)) {
      const counts = this.statingBy.get(key) as Map<string, number>;
      const foods = counts.get('foods') ?? 0;
      const source = key.split('/')[1] ?? '';
      out += `\n${key}: ${foods} foods\n`;
      const columns = ['sodium_mg', ...PackMicronutrient.values.map((n) => PackMicronutrient.column(n))];
      const rows = [...columns, ...Object.keys(readiness).filter((row) => row !== 'sodium')];
      for (const row of rows) {
        const count = counts.get(row) ?? 0;
        const share = foods === 0 ? 0 : Math.round((100 * count) / foods);
        const low = referenceSources.has(source) && columns.includes(row) && share < lowShareBelowPercent ? '  LOW' : '';
        out += `    ${row}: ${count} (${share}%)${low}\n`;
      }
    }
    return out;
  }
}
