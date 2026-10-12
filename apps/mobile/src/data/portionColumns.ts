import type { FoodOrigin } from '../domain/food/portion/FoodOrigin';
import { NutritionBasis } from '../domain/food/portion/NutritionBasis';
import { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import type { Portion } from '../domain/food/portion/Portion';
import { PortionUnit } from '../domain/food/portion/PortionUnit';
import { ReferenceBasis } from '../domain/food/portion/ReferenceBasis';
import type { ReferenceNutrition } from '../domain/food/portion/ReferenceNutrition';
import { QuantitySource } from '../domain/QuantitySource';
import type { SqlRow } from '../sql/SqlRow';
import { named, optionalInteger, optionalNamed, optionalNumber, optionalText, orNull } from './columns';
import type { Values } from './statements';

/** The portion a food row holds, or undefined for a row saved without one. */
export function portionFromRow(r: SqlRow): Portion | undefined {
  const basis = optionalNamed(NutritionBasis.values, r, 'nutrition_basis');
  if (basis === undefined) return undefined;
  const refBasis = optionalNamed(ReferenceBasis.values, r, 'reference_basis');
  const kcal = optionalNumber(r, 'reference_kcal');
  const protein = optionalNumber(r, 'reference_protein_g');
  const carbs = optionalNumber(r, 'reference_carbs_g');
  const fat = optionalNumber(r, 'reference_fat_g');
  const reference: ReferenceNutrition | undefined =
    refBasis === undefined || kcal === undefined || protein === undefined || carbs === undefined || fat === undefined
      ? undefined
      : {
          basis: refBasis,
          nutrition: new NutritionTotals({ kcal, proteinG: protein, carbsG: carbs, fatG: fat }),
          servingDescription: optionalText(r, 'serving_description'),
          servingGrams: optionalNumber(r, 'serving_grams'),
          servingMilliliters: optionalNumber(r, 'serving_milliliters'),
          servingUnit: optionalNamed(PortionUnit.values, r, 'serving_unit'),
          densityGPerMl: optionalNumber(r, 'density_g_per_ml'),
        };
  const packId = optionalText(r, 'origin_pack_id');
  const foodId = optionalInteger(r, 'origin_food_id');
  const source = optionalText(r, 'origin_source');
  const origin: FoodOrigin | undefined =
    packId === undefined || foodId === undefined || source === undefined
      ? undefined
      : { packId, foodId, source, sourceId: optionalText(r, 'origin_source_id') };
  return {
    method: named(QuantitySource.values, r, 'quantity_source'),
    basis,
    quantity: optionalNumber(r, 'portion_quantity'),
    unit: optionalNamed(PortionUnit.values, r, 'portion_unit'),
    reference,
    impliedGrams: optionalNumber(r, 'implied_grams'),
    handModelVersion: optionalInteger(r, 'hand_model_version'),
    origin,
  };
}

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
