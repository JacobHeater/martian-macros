import type { CustomFood } from '../domain/food/custom/CustomFood';
import { Micronutrient } from '../domain/food/micros/Micronutrient';
import type { Micronutrients } from '../domain/food/micros/Micronutrients';
import type { NutritionTotals } from '../domain/food/portion/NutritionTotals';
import type { Portion } from '../domain/food/portion/Portion';
import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodCopy } from './FoodCopy';
import { foodCopyFormat } from './foodCopyFormat';

const totals = (t: NutritionTotals) => ({ kcal: t.kcal, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG });

/** The micronutrients stated, by name; none is left out. */
const micros = (m: Micronutrients) => Object.fromEntries(Micronutrient.values.flatMap((n) => (m.of(n) === undefined ? [] : [[n, m.of(n)]])));

const portion = (p: Portion | undefined) =>
  p === undefined
    ? undefined
    : {
        method: p.method,
        basis: p.basis,
        quantity: p.quantity,
        unit: p.unit,
        reference:
          p.reference === undefined
            ? undefined
            : {
                basis: p.reference.basis,
                nutrition: totals(p.reference.nutrition),
                servingDescription: p.reference.servingDescription,
                servingGrams: p.reference.servingGrams,
                servingMilliliters: p.reference.servingMilliliters,
                servingUnit: p.reference.servingUnit,
                densityGPerMl: p.reference.densityGPerMl,
              },
        origin: p.origin,
        preparation: p.preparation,
        conversion: p.conversion,
        impliedGrams: p.impliedGrams,
        handModelVersion: p.handModelVersion,
      };

const entry = (e: FoodEntry) => ({
  date: e.date.epochDay,
  meal: e.meal,
  name: e.name,
  kcal: e.kcal,
  proteinG: e.proteinG,
  carbsG: e.carbsG,
  fatG: e.fatG,
  source: e.source,
  portion: portion(e.portion),
  fiberG: e.fiberG,
  sugarAlcoholsG: e.sugarAlcoholsG,
  sodiumMg: e.sodiumMg,
  alcoholG: e.alcoholG,
  micros: micros(e.micros),
  eatenAt: e.eatenAt,
  loggedMeal: e.loggedMeal,
  evidence: e.evidence,
});

const food = (f: CustomFood) => ({
  id: f.id,
  name: f.name,
  kind: f.kind,
  servingDescription: f.servingDescription,
  servingGrams: f.servingGrams,
  perServing: totals(f.perServing),
  barcode: f.barcode,
  servings: f.servings,
  cookedWeightGrams: f.cookedWeightGrams,
  ingredients: f.ingredients.map((i) => ({ name: i.name, grams: i.grams, totals: totals(i.totals), source: i.source })),
  fiberG: f.fiberG,
  sugarAlcoholsG: f.sugarAlcoholsG,
  micros: micros(f.micros),
  group: f.group,
  evidence: f.evidence,
  madeOf: f.madeOf.map((line) => ({ name: line.name, grams: line.grams })),
});

/**
 * A copy of foods as the bytes that cross to the other phone (MM-715): JSON, the format named and versioned
 * first, the day as its epoch day, every entry and every Library food with all it holds. What is undefined is
 * left out. `foodCopyOfBytes` reads it back.
 */
export function foodCopyBytes(copy: FoodCopy): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify({ ...foodCopyFormat, day: copy.day.epochDay, entries: copy.entries.map(entry), foods: copy.foods.map(food) }),
  );
}
