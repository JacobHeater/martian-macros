import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import type { HandSize } from '../domain/food/hand/HandSize';
import { gramsFor } from '../domain/food/portion/gramsFor';
import { millilitersFor } from '../domain/food/portion/millilitersFor';
import { gradeMicrosFrom } from './gradeMicrosFrom';
import { gradeOfNutrition } from './gradeOfNutrition';

/**
 * A logged food's grade (MM-382): the food itself, recovered from the
 * entry's totals and the amount it was logged as, so the amount eaten does
 * not change it: its grams, or for a drink stated per 100 mL its
 * millilitres, read as the pack reads them, per 100 (MM-654). An estimate
 * is not graded (MM-150); an entry whose amount is not known (typed totals,
 * a hand portion before the hand model, an entry from before portions were
 * kept) has no calories per gram to grade.
 */
export function gradeOfFoodEntry(entry: FoodEntry, { hand }: { hand?: HandSize | undefined } = {}): FoodGradeValue {
  if (entry.source === 'quickAdd') return { kind: 'ungradable', reason: 'Estimated, so not graded.' };
  const amount = amountOf(entry, hand);
  if (amount === undefined || !(amount > 0)) {
    return { kind: 'ungradable', reason: 'The amount in grams or millilitres isn’t known, so the food can’t be graded.' };
  }
  const scale = 100 / amount;
  const per100 = (value: number | undefined) => (value === undefined ? undefined : value * scale);
  return gradeOfNutrition(
    {
    kcal: entry.kcal * scale,
    proteinG: entry.proteinG * scale,
    fatG: entry.fatG * scale,
    carbsG: entry.carbsG * scale,
    fiberG: per100(entry.fiberG),
    sodiumMg: per100(entry.sodiumMg),
    sugarsG: per100(entry.micros.of('sugars')),
    saturatedFatG: per100(entry.micros.of('saturatedFat')),
    alcoholG: per100(entry.alcoholG),
    micros: gradeMicrosFrom((n) => entry.micros.of(n), scale),
    },
    { name: entry.name },
  );
}

/**
 * The amount an entry was logged as, in its food's own basis, when it can be
 * known: grams, or millilitres for a food stated per 100 mL (MM-650), whose
 * weight is not known without a density. A drink is graded per 100 mL as
 * the pack grades it, so the logged can and the search row agree.
 */
function amountOf(entry: FoodEntry, hand: HandSize | undefined): number | undefined {
  const portion = entry.portion;
  if (portion === undefined || portion.quantity === undefined || portion.unit === undefined) return undefined;
  if (portion.impliedGrams !== undefined) return portion.impliedGrams;
  const reference = portion.reference;
  if (reference === undefined) return undefined;
  const grams = gramsFor(portion.quantity, portion.unit, reference, { hand });
  if (reference.basis === 'per100ml') return millilitersFor(portion.quantity, portion.unit, reference) ?? grams;
  return grams ?? millilitersFor(portion.quantity, portion.unit, reference);
}
