import type { CatalogBasis } from '../foodCatalog/CatalogBasis';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
import type { PackMicros } from '../foodCatalog/PackMicros';
import type { FoodKind } from './FoodKind';

interface CandidateFoodInit {
  source: string;
  sourceId: string;
  kind: FoodKind;
  name: string;
  brand?: string | undefined;
  rawBarcode?: string | undefined;
  kcal?: number | undefined;
  proteinG?: number | undefined;
  carbsG?: number | undefined;
  fatG?: number | undefined;
  fiberG?: number | undefined;
  sugarAlcoholsG?: number | undefined;
  sodiumMg?: number | undefined;
  alcoholG?: number | undefined;
  micros?: PackMicros;
  servings?: readonly CatalogServing[];
  versionKey?: number;
  updatedAt?: number;
  category?: string | undefined;
  basis?: CatalogBasis | undefined;
}

/**
 * One food as a source states it, mapped onto the pipeline's single schema
 * but not yet checked.
 */
export class CandidateFood {
  /** `usda_branded`, `usda_foundation`, `usda_sr_legacy`, `usda_fndds` or `off` (MM-383). */
  readonly source: string;

  /** The food's id in that source. */
  readonly sourceId: string;
  readonly kind: FoodKind;
  readonly name: string;
  readonly brand: string | undefined;

  /** The barcode as the source stored it, before normalization. */
  readonly rawBarcode: string | undefined;
  readonly kcal: number | undefined;
  readonly proteinG: number | undefined;
  readonly carbsG: number | undefined;
  readonly fatG: number | undefined;
  readonly fiberG: number | undefined;
  /** Sugar alcohols per 100 of the basis, when the source states them (MM-397). */
  readonly sugarAlcoholsG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly alcoholG: number | undefined;

  /** The micronutrients besides sodium the source states, per 100 of the basis (MM-307). */
  readonly micros: PackMicros;
  readonly servings: readonly CatalogServing[];

  /** Orders versions of the same product within one source: the highest wins. */
  readonly versionKey: number;

  /**
   * When the source last changed this record, in seconds since 1970; 0 when
   * the source does not say.
   */
  readonly updatedAt: number;

  /**
   * The source's own category (MM-616): `food_category` for Foundation and
   * SR Legacy foods, the WWEIA category for FNDDS foods,
   * `branded_food_category` for branded products; undefined for Open Food
   * Facts and wherever the source gives none. The pipeline maps it to a
   * food group.
   */
  readonly category: string | undefined;

  /**
   * What the per-100 figures are for (MM-650): 100 g, or 100 mL for a liquid
   * the source states so (a USDA Branded row served in mL, an Open Food Facts
   * product whose serving is a number of millilitres).
   */
  readonly basis: CatalogBasis;

  constructor(init: CandidateFoodInit) {
    this.source = init.source;
    this.sourceId = init.sourceId;
    this.kind = init.kind;
    this.name = init.name;
    this.brand = init.brand;
    this.rawBarcode = init.rawBarcode;
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.carbsG = init.carbsG;
    this.fatG = init.fatG;
    this.fiberG = init.fiberG;
    this.sugarAlcoholsG = init.sugarAlcoholsG;
    this.sodiumMg = init.sodiumMg;
    this.alcoholG = init.alcoholG;
    this.micros = init.micros ?? {};
    this.servings = init.servings ?? [];
    this.versionKey = init.versionKey ?? 0;
    this.updatedAt = init.updatedAt ?? 0;
    this.category = init.category;
    this.basis = init.basis ?? 'per100g';
  }
}
