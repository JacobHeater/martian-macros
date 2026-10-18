import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import type { HandSize } from '../domain/food/hand/HandSize';
import { gramsFor } from '../domain/food/portion/gramsFor';
import { gradeMicrosFrom } from './gradeMicrosFrom';
import { gradeOfNutrition } from './gradeOfNutrition';

/**
 * A logged food's grade (MM-382): the food itself, recovered from the
 * entry's totals and the grams it was logged as, so the amount eaten does
 * not change it. An estimate is not graded (MM-150); an entry whose grams
 * are not known (typed totals, a hand portion before the hand model, an
 * entry from before portions were kept) has no calories per gram to grade.
 */
export function gradeOfFoodEntry(entry: FoodEntry, { hand }: { hand?: HandSize | undefined } = {}): FoodGradeValue {
  if (entry.source === 'quickAdd') return { kind: 'ungradable', reason: 'Estimated, so not graded.' };
  const grams = gramsOf(entry, hand);
  if (grams === undefined || !(grams > 0)) {
    return { kind: 'ungradable', reason: 'The amount in grams isn’t known, so the food can’t be graded.' };
  }
  const scale = 100 / grams;
  const per100 = (value: number | undefined) => (value === undefined ? undefined : value * scale);
  return gradeOfNutrition({
    kcal: entry.kcal * scale,
    proteinG: entry.proteinG * scale,
    fiberG: per100(entry.fiberG),
    sodiumMg: per100(entry.sodiumMg),
    sugarsG: per100(entry.micros.of('sugars')),
    saturatedFatG: per100(entry.micros.of('saturatedFat')),
    alcoholG: per100(entry.alcoholG),
    micros: gradeMicrosFrom((n) => entry.micros.of(n), scale),
  });
}

/** The grams an entry was logged as, when they can be known. */
function gramsOf(entry: FoodEntry, hand: HandSize | undefined): number | undefined {
  const portion = entry.portion;
  if (portion === undefined || portion.quantity === undefined || portion.unit === undefined) return undefined;
  if (portion.impliedGrams !== undefined) return portion.impliedGrams;
  if (portion.reference === undefined) return undefined;
  return gramsFor(portion.quantity, portion.unit, portion.reference, { hand });
}
