import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CustomFood } from '../../src/domain/food/custom/CustomFood';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import type { FoodCopy } from '../../src/transfer/FoodCopy';
import { foodCopyBytes } from '../../src/transfer/foodCopyBytes';
import { foodCopyOfBytes } from '../../src/transfer/foodCopyOfBytes';

/**
 * MM-715: the copy of foods as it crosses to the other phone: every field of an entry and of a Library food comes
 * back as it went, and anything that is not the format is not read at all.
 */
const day = CalendarDate.of(2026, 10, 30);

const recipe = new CustomFood({
  id: 7,
  name: 'Mom’s salmon bake',
  kind: 'recipe',
  servingDescription: '1 serving',
  servingGrams: 180,
  perServing: new NutritionTotals({ kcal: 410, proteinG: 34, carbsG: 12, fatG: 24 }),
  servings: 4,
  cookedWeightGrams: 720,
  ingredients: [
    { name: 'Salmon', grams: 500, totals: new NutritionTotals({ kcal: 1040, proteinG: 104, carbsG: 0, fatG: 68 }), source: { packId: 'usda', foodId: 4411 } },
    { name: 'Cream', totals: new NutritionTotals({ kcal: 600, proteinG: 32, carbsG: 48, fatG: 28 }) },
  ],
  fiberG: 1.5,
  micros: new Micronutrients({ sodium: 320, calcium: 90 }),
  group: 'fish',
  evidence: { kind: 'yours', citation: undefined },
  madeOf: [{ name: 'dill', grams: 3 }],
});

const salmon = new FoodEntry({
  id: 0,
  date: day,
  meal: 'dinner',
  name: recipe.name,
  kcal: 410,
  proteinG: 34,
  carbsG: 12,
  fatG: 24,
  source: 'labelServing',
  portion: {
    method: 'labelServing',
    basis: 'calculated',
    quantity: 1,
    unit: 'serving',
    reference: {
      basis: 'perServing',
      nutrition: new NutritionTotals({ kcal: 410, proteinG: 34, carbsG: 12, fatG: 24 }),
      servingDescription: '1 serving',
      servingGrams: 180,
    },
    origin: { packId: 'custom', foodId: 7, source: 'user' },
    impliedGrams: 180,
  },
  fiberG: 1.5,
  sodiumMg: 320,
  micros: new Micronutrients({ sodium: 320, calcium: 90 }),
  loggedMeal: { key: 'k1', name: 'Friday dinner' },
  evidence: { kind: 'yours' },
});

const apple = new FoodEntry({ id: 0, date: day, meal: 'snack', name: 'Apple', kcal: 95, proteinG: 0, carbsG: 25, fatG: 0, source: 'quickAdd', eatenAt: 15 * 60 });

/** A drink had at 8:30 that morning (MM-718). */
const glass = new WaterEntry({ id: 5, date: day, ml: 250, at: new Date(2026, 9, 30, 8, 30) });

/** What goes: two entries, one a logged meal's from a recipe, that recipe, and a drink of water. */
const copy: FoodCopy = { day, entries: [salmon, apple], water: [glass], foods: [recipe] };

describe('a copy of foods', () => {
  it('comes back as it went: the day, every entry with its portion, origin, micros, meal tag and evidence, and the Library food', () => {
    const read = foodCopyOfBytes(foodCopyBytes(copy));
    expect(read).toBeDefined();
    expect(read?.day).toBe(day);
    expect(read?.entries.map((e) => e.name)).toEqual(['Mom’s salmon bake', 'Apple']);
    const back = read?.entries[0];
    expect(back?.portion?.origin).toEqual({ packId: 'custom', foodId: 7, source: 'user', sourceId: undefined });
    expect(back?.portion?.reference?.nutrition.kcal).toBe(410);
    expect(back?.portion?.impliedGrams).toBe(180);
    expect(back?.micros.of('calcium')).toBe(90);
    expect(back?.loggedMeal).toEqual({ key: 'k1', name: 'Friday dinner' });
    expect(back?.fiberG).toBe(1.5);
    expect(read?.entries[1]?.eatenAt).toBe(15 * 60);
    expect(read?.entries[1]?.portion).toBeUndefined();
    const food = read?.foods[0];
    expect(food?.id, 'the sending phone’s id, for linking').toBe(7);
    expect(food?.kind).toBe('recipe');
    expect(food?.ingredients).toHaveLength(2);
    expect(food?.ingredients[0]?.source).toEqual({ packId: 'usda', foodId: 4411 });
    expect(food?.ingredients[1]?.grams).toBeUndefined();
    expect(food?.perServing.proteinG).toBe(34);
    expect(food?.micros.of('sodium')).toBe(320);
    expect(food?.group).toBe('fish');
    expect(food?.madeOf).toEqual([{ name: 'dill', grams: 3 }]);
    expect(food?.servings).toBe(4);
    const drink = read?.water[0];
    expect(drink?.id, 'logged as a new drink').toBe(0);
    expect(drink?.date).toBe(day);
    expect(drink?.ml).toBe(250);
    expect(drink?.at.getTime(), 'the moment it was had (MM-718)').toBe(glass.at.getTime());
  });

  it('MM-719: a whole day carries its marks, and a copy that is not one carries none', () => {
    const read = foodCopyOfBytes(foodCopyBytes({ ...copy, whole: { kind: 'refeed', completeness: 'complete' } }));
    expect(read?.whole).toEqual({ kind: 'refeed', completeness: 'complete' });
    expect(foodCopyOfBytes(foodCopyBytes(copy))?.whole).toBeUndefined();
  });

  it('MM-718: water alone is a copy; nothing at all is not', () => {
    const read = foodCopyOfBytes(foodCopyBytes({ day, entries: [], water: [glass], foods: [] }));
    expect(read?.entries).toEqual([]);
    expect(read?.water).toHaveLength(1);
    expect(foodCopyOfBytes(foodCopyBytes({ day, entries: [], water: [], foods: [] }))).toBeUndefined();
  });

  it('logs every entry as a new one, whatever id it carried', () => {
    const logged = salmon.copyWith({ id: 88 });
    const read = foodCopyOfBytes(foodCopyBytes({ day, entries: [logged], water: [], foods: [] }));
    expect(read?.entries[0]?.id).toBe(0);
  });

  it('is not read from anything else, and never in part', () => {
    const encoder = new TextEncoder();
    const good = JSON.parse(new TextDecoder().decode(foodCopyBytes(copy))) as Record<string, unknown>;
    const entries = good['entries'] as Record<string, unknown>[];
    const cases: string[] = [
      'not json',
      '{}',
      JSON.stringify({ ...good, format: 'martian-macros-food' }),
      JSON.stringify({ ...good, version: 1 }),
      JSON.stringify({ ...good, entries: [], water: [] }),
      JSON.stringify({ ...good, water: [{ date: day.epochDay, ml: 0, at: 1 }] }),
      JSON.stringify({ ...good, water: [{ date: day.epochDay, ml: 250, at: 'morning' }] }),
      JSON.stringify({ ...good, water: undefined }),
      JSON.stringify({ ...good, whole: { kind: 'cheat', completeness: 'complete' } }),
      JSON.stringify({ ...good, whole: { kind: 'refeed' } }),
      JSON.stringify({ ...good, entries: [{ ...entries[0], meal: 'brunch' }] }),
      JSON.stringify({ ...good, entries: [{ ...entries[0], kcal: 'lots' }] }),
      JSON.stringify({ ...good, entries: [{ ...entries[1], portion: { method: 'weighed', basis: 'per100g' } }] }),
      JSON.stringify({ ...good, foods: [{ name: 'No kind' }] }),
      JSON.stringify({ ...good, day: 1.5 }),
    ];
    for (const text of cases) expect(foodCopyOfBytes(encoder.encode(text)), text.slice(0, 60)).toBeUndefined();
    expect(foodCopyOfBytes(new Uint8Array([0xff, 0xfe, 0x00]))).toBeUndefined();
  });
});
