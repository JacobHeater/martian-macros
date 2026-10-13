import type { Portion } from '../domain/food/portion/Portion';
import { orNull } from './columns';
import type { Values } from './Values';

/** The portion's columns: every one, so that saving without a portion clears it. */
export function portionValues(portion: Portion | undefined): Values {
  const reference = portion?.reference;
  return {
    portion_quantity: orNull(portion?.quantity),
    portion_unit: orNull(portion?.unit),
    nutrition_basis: orNull(portion?.basis),
    reference_basis: orNull(reference?.basis),
    reference_kcal: orNull(reference?.nutrition.kcal),
    reference_protein_g: orNull(reference?.nutrition.proteinG),
    reference_carbs_g: orNull(reference?.nutrition.carbsG),
    reference_fat_g: orNull(reference?.nutrition.fatG),
    serving_description: orNull(reference?.servingDescription),
    serving_grams: orNull(reference?.servingGrams),
    serving_milliliters: orNull(reference?.servingMilliliters),
    serving_unit: orNull(reference?.servingUnit),
    density_g_per_ml: orNull(reference?.densityGPerMl),
    implied_grams: orNull(portion?.impliedGrams),
    hand_model_version: orNull(portion?.handModelVersion),
    origin_pack_id: orNull(portion?.origin?.packId),
    origin_food_id: orNull(portion?.origin?.foodId),
    origin_source: orNull(portion?.origin?.source),
    origin_source_id: orNull(portion?.origin?.sourceId),
  };
}
