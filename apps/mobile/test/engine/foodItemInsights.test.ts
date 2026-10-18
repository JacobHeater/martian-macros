import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import type { Portion } from '../../src/domain/food/portion/Portion';
import type { QuantitySource } from '../../src/domain/QuantitySource';
import { foodItemInsights } from '../../src/engine/foodItemInsights';

const day = CalendarDate.of(2026, 10, 17);
let nextId = 1;

/** An entry of `kcal` with its macros, logged with `source`, and a portion when given. */
function entry(
  name: string,
  kcal: number,
  macros: { protein: number; carbs: number; fat: number; alcohol?: number },
  { source = 'weighed', portion }: { source?: QuantitySource; portion?: Portion } = {},
): FoodEntry {
  return new FoodEntry({
    id: nextId++,
    date: day,
    meal: 'lunch',
    name,
    kcal,
    proteinG: macros.protein,
    carbsG: macros.carbs,
    fatG: macros.fat,
    alcoholG: macros.alcohol,
    source,
    portion,
  });
}

/** Logged as `servings` servings of a food whose serving is `servingGrams`. */
const servingsOf = (servings: number, servingGrams: number | undefined): Portion => ({
  method: 'labelServing',
  basis: 'calculated',
  quantity: servings,
  unit: 'serving',
  reference: { basis: 'perServing', nutrition: new NutritionTotals({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }), servingGrams },
});

const kinds = (entries: FoodEntry[], proteinMinimumG: number | undefined = 140) =>
  foodItemInsights({ entries, proteinMinimumG }).map((i) => [i.kind, i.subject]);

describe('foodItemInsights (MM-365)', () => {
  it("the owner's example: most of a food's calories from fat, with the share", () => {
    const peanutButter = entry('Peanut butter', 190, { protein: 7, carbs: 7, fat: 16 });
    const [insight] = foodItemInsights({ entries: [peanutButter], proteinMinimumG: 140 });
    expect(insight?.kind).toBe('mostlyFat');
    expect(insight?.anchor).toEqual({ kind: 'foodEntry', id: `${peanutButter.id}` });
    expect(insight?.subject).toBe('Peanut butter');
    expect(insight?.figures['fatShare']).toBeCloseTo(0.758, 3);
  });

  it('a protein food is never mostly fat: eggs, tofu, cheese carry their protein', () => {
    expect(kinds([entry('Eggs', 215, { protein: 19, carbs: 1.5, fat: 14 })])).toEqual([]);
    expect(kinds([entry('Firm tofu', 216, { protein: 26, carbs: 5, fat: 14 })])).toEqual([]);
  });

  it('a small fatty item is left alone', () => {
    expect(kinds([entry('Butter', 90, { protein: 0, carbs: 0, fat: 10 })])).toEqual([]);
  });

  it('the fat share is capped at 100%', () => {
    const [insight] = foodItemInsights({ entries: [entry('Olive oil', 240, { protein: 0, carbs: 0, fat: 27 })], proteinMinimumG: 140 });
    expect(insight?.figures['fatShare']).toBe(1);
  });

  it('light on protein: a meal-sized item with little protein, while a minimum is in force', () => {
    const pasta = entry('Pasta with cream sauce', 640, { protein: 14, carbs: 70, fat: 32 });
    expect(kinds([pasta])).toEqual([['lightOnProtein', 'Pasta with cream sauce']]);
    expect(foodItemInsights({ entries: [pasta], proteinMinimumG: undefined })).toEqual([]);
    expect(foodItemInsights({ entries: [pasta], proteinMinimumG: 140 })[0]?.figures['proteinMinimumG']).toBe(140);
  });

  it('two rules on one entry both come out; the filter picks one', () => {
    const rich = entry('Cream sauce', 600, { protein: 8, carbs: 20, fat: 47 });
    expect(kinds([rich]).map(([kind]) => kind).sort()).toEqual(['lightOnProtein', 'mostlyFat']);
  });

  it('a food typed with calories alone says nothing', () => {
    expect(kinds([entry('Takeaway curry', 450, { protein: 0, carbs: 0, fat: 0 })])).toEqual([]);
  });

  it('a drink that is mostly alcohol gets no protein line', () => {
    expect(kinds([entry('Red wine', 400, { protein: 0.5, carbs: 12, fat: 0, alcohol: 50 })])).toEqual([]);
  });

  it('an estimate gets nothing', () => {
    expect(kinds([entry('Rich meal', 800, { protein: 20, carbs: 60, fat: 44 }, { source: 'quickAdd' })])).toEqual([]);
  });

  it('a portion check for a large count of servings, naming the serving', () => {
    const bread = entry('Garlic bread', 350, { protein: 8, carbs: 40, fat: 17 }, { source: 'labelServing', portion: servingsOf(4, 30) });
    const [insight] = foodItemInsights({ entries: [bread], proteinMinimumG: 140 });
    expect(insight?.kind).toBe('portionCheck');
    expect(insight?.figures).toMatchObject({ servings: 4, servingGrams: 30, kcal: 350 });
  });

  it('no portion check for a small count, a food logged by weight, or a hand portion', () => {
    expect(kinds([entry('Granola', 230, { protein: 5, carbs: 40, fat: 6 }, { source: 'labelServing', portion: servingsOf(1, 55) })])).toEqual([]);
    const weighed: Portion = { method: 'weighed', basis: 'calculated', quantity: 316, unit: 'gram' };
    expect(kinds([entry('White rice', 410, { protein: 8.5, carbs: 90, fat: 0.9 }, { portion: weighed })]).map(([k]) => k)).toEqual(['lightOnProtein']);
    const palms: Portion = { method: 'palm', basis: 'calculated', quantity: 2, unit: 'palm', impliedGrams: 220 };
    expect(kinds([entry('Chicken breast', 360, { protein: 68, carbs: 0, fat: 8 }, { source: 'palm', portion: palms })])).toEqual([]);
  });

  it('a count that is almost surely a typo is asked about whatever the calories', () => {
    const yogurt = entry('Yogurt', 80, { protein: 5, carbs: 10, fat: 2 }, { source: 'labelServing', portion: servingsOf(100, 150) });
    expect(kinds([yogurt])).toEqual([['portionCheck', 'Yogurt']]);
  });
});
