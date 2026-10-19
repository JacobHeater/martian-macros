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
  /** Sugar alcohols per 100 g, when the source states them (MM-397). */
  readonly sugarAlcoholsG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly alcoholG: number | undefined;

  /** The micronutrients besides sodium the source states, per 100 g (MM-307). */
  readonly micros: PackMicros;
  readonly servings: readonly CatalogServing[];

  /** Orders versions of the same product within one source: the highest wins. */
  readonly versionKey: number;

  /**
   * When the source last changed this record, in seconds since 1970; 0 when
   * the source does not say.
   */
  readonly updatedAt: number;

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
  }
}
