import type { SqlValue } from '../../sql/SqlValue';
import type { PackEntry } from '../PackEntry';
import { TrustTier } from '../TrustTier';

/**
 * The columns of `online_foods` as one entry writes them (MM-58): the
 * nutrients unscaled, the micronutrients and servings as JSON, since the
 * table is a cache of foreign records and never joined.
 */
export function onlineFoodRow(entry: PackEntry): Record<string, SqlValue> {
  const { food } = entry;
  return {
    gtin: entry.barcodes?.[0] ?? null,
    name: food.name,
    brand: food.brand ?? null,
    kcal: food.kcal,
    protein_g: food.proteinG,
    carbs_g: food.carbsG,
    fat_g: food.fatG,
    fiber_g: food.fiberG ?? null,
    sugar_alcohols_g: food.sugarAlcoholsG ?? null,
    sodium_mg: food.sodiumMg ?? null,
    alcohol_g: food.alcoholG ?? null,
    micros: JSON.stringify(food.micros),
    servings: JSON.stringify(entry.servings ?? []),
    source: food.source,
    source_id: food.sourceId ?? null,
    tier: TrustTier.code(food.tier),
    tier_reason: food.tierReason,
  };
}
