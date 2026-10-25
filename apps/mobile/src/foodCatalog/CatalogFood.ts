import type { FoodGroup } from '../domain/food/FoodGroup';
import type { PackMicros } from './PackMicros';
import type { PreparationState } from './PreparationState';
import type { TrustTier } from './TrustTier';

interface CatalogFoodInit {
  id: number;
  packId: string;
  name: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: string;
  tier: TrustTier;
  tierReason: string;
  brand?: string | undefined;
  fiberG?: number | undefined;
  sugarAlcoholsG?: number | undefined;
  sodiumMg?: number | undefined;
  alcoholG?: number | undefined;
  micros?: PackMicros;
  preparation?: PreparationState;
  pairedFoodId?: number | undefined;
  densityGPerMl?: number | undefined;
  sourceId?: string | undefined;
  group?: FoodGroup | undefined;
}

/** One food as a pack states it, per 100 g. */
export class CatalogFood {
  /** Unique within its pack. */
  readonly id: number;
  readonly packId: string;
  readonly name: string;
  readonly brand: string | undefined;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly fiberG: number | undefined;
  /** Sugar alcohols per 100 g, when the source states them (MM-397). */
  readonly sugarAlcoholsG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly alcoholG: number | undefined;

  /** The micronutrients besides sodium, per 100 g, as a format 2 pack states them (MM-307). */
  readonly micros: PackMicros;
  readonly preparation: PreparationState;

  /** The raw food of a cooked one, or the cooked of a raw one. */
  readonly pairedFoodId: number | undefined;

  /** Grams per millilitre, for foods measured by volume. */
  readonly densityGPerMl: number | undefined;
  readonly source: string;

  /**
   * The food's id in that source (a USDA `fdc_id`, an Open Food Facts
   * `code`), so a pack entry can be traced back to where it came from.
   */
  readonly sourceId: string | undefined;

  /**
   * What kind of food it is (MM-616), mapped by the pipeline from the
   * source's category. Undefined when the category maps to no group, or the
   * pack is older than format 4.
   */
  readonly group: FoodGroup | undefined;
  readonly tier: TrustTier;

  /** Why it has that tier, in a sentence. */
  readonly tierReason: string;

  constructor(init: CatalogFoodInit) {
    this.id = init.id;
    this.packId = init.packId;
    this.name = init.name;
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.carbsG = init.carbsG;
    this.fatG = init.fatG;
    this.source = init.source;
    this.tier = init.tier;
    this.tierReason = init.tierReason;
    this.brand = init.brand;
    this.fiberG = init.fiberG;
    this.sugarAlcoholsG = init.sugarAlcoholsG;
    this.sodiumMg = init.sodiumMg;
    this.alcoholG = init.alcoholG;
    this.micros = init.micros ?? {};
    this.preparation = init.preparation ?? 'unspecified';
    this.pairedFoodId = init.pairedFoodId;
    this.densityGPerMl = init.densityGPerMl;
    this.sourceId = init.sourceId;
    this.group = init.group;
  }
}
