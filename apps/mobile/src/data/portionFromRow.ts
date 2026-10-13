import type { FoodOrigin } from '../domain/food/portion/FoodOrigin';
import { NutritionBasis } from '../domain/food/portion/NutritionBasis';
import { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import type { Portion } from '../domain/food/portion/Portion';
import { PortionUnit } from '../domain/food/portion/PortionUnit';
import { ReferenceBasis } from '../domain/food/portion/ReferenceBasis';
import type { ReferenceNutrition } from '../domain/food/portion/ReferenceNutrition';
import { QuantitySource } from '../domain/QuantitySource';
import type { SqlRow } from '../sql/SqlRow';
import { named, optionalInteger, optionalNamed, optionalNumber, optionalText } from './columns';

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
