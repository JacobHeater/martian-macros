import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { Caution } from '../../src/domain/Caution';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { NutritionTotals } from '../../src/domain/food/portion/NutritionTotals';
import type { Meal } from '../../src/domain/Meal';
import type { QuantitySource } from '../../src/domain/QuantitySource';
import { findTrade } from '../../src/engine/analysis/findTrade';
import { findTrades } from '../../src/engine/analysis/findTrades';
import type { TradeCatalogFood } from '../../src/engine/analysis/TradeCatalogFood';
import type { TradeInput } from '../../src/engine/analysis/TradeInput';
import type { InsightSafeguards } from '../../src/engine/InsightSafeguards';
import { InMemoryTradeCatalog } from '../../src/fixtures/InMemoryTradeCatalog';

/** MM-607: trade X for Y, from the person's own foods first, then the catalog in X's group. */

const start = CalendarDate.of(2026, 10, 1);
let nextId = 1;

interface Food {
  readonly name: string;
  readonly meal: Meal;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly sodiumMg?: number | undefined;
  readonly fiberG?: number | undefined;
  readonly alcoholG?: number | undefined;
  readonly source?: QuantitySource | undefined;
  /** The catalog food it was logged from. */
  readonly foodId?: number | undefined;
  readonly packId?: string | undefined;
  readonly micros?: Micronutrients | undefined;
}

/** `food` logged on each of `days` (0 is the span's first day). */
function logged(food: Food, days: readonly number[]): FoodEntry[] {
  return days.map(
    (day) =>
      new FoodEntry({
        id: nextId++,
        date: start.addDays(day),
        meal: food.meal,
        name: food.name,
        kcal: food.kcal,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        sodiumMg: food.sodiumMg,
        fiberG: food.fiberG,
        alcoholG: food.alcoholG,
        micros: food.micros,
        source: food.source ?? 'labelServing',
        portion:
          food.foodId === undefined
            ? undefined
            : {
                method: food.source ?? 'labelServing',
                basis: 'calculated',
                quantity: 1,
                unit: 'serving',
                reference: {
                  basis: 'perServing',
                  nutrition: new NutritionTotals({ kcal: food.kcal, proteinG: food.proteinG, carbsG: food.carbsG, fatG: food.fatG }),
                },
                origin: { packId: food.packId ?? 'pack', foodId: food.foodId, source: 'usda_branded' },
              },
      }),
  );
}

const granola: Food = { name: 'Granola', meal: 'breakfast', kcal: 420, proteinG: 9, carbsG: 55, fatG: 18, sodiumMg: 120, fiberG: 5, foodId: 1 };
const yogurt: Food = { name: 'Greek yogurt with berries', meal: 'breakfast', kcal: 330, proteinG: 28, carbsG: 41, fatG: 6, sodiumMg: 100, fiberG: 4 };
const porridge: Food = { name: 'Oat porridge with milk', meal: 'breakfast', kcal: 380, proteinG: 14, carbsG: 63, fatG: 8 };

const granolaDays = [0, 2, 4, 6, 8, 10];
const granolaEntries = () => logged(granola, granolaDays);

const safe: InsightSafeguards = {
  adult: true,
  eatingDisorderHistory: false,
  weightHidden: false,
  paused: false,
  underEating: false,
  cautions: new Set(),
};

const cereal = (name: string, kcal: number, proteinG: number, carbsG: number, fatG: number): TradeCatalogFood => ({
  name,
  group: 'breakfastCereals',
  grams: 90,
  kcal,
  proteinG,
  carbsG,
  fatG,
  sodiumMg: 100,
  fiberG: 6,
  alcoholG: undefined,
  grade: undefined,
});

const catalog = (...foods: TradeCatalogFood[]) =>
  new InMemoryTradeCatalog([
    { packId: 'pack', foodId: 1, food: cereal('Granola', 420, 9, 55, 18) },
    ...foods.map((food, at) => ({ packId: 'pack', foodId: 100 + at, food })),
    {
      packId: 'pack',
      foodId: 99,
      food: { ...cereal('Tuna, canned', 200, 40, 0, 2), group: 'fish' as const },
    },
  ]);

/** The owner's example: granola on 6 of 14 days, Greek yogurt at breakfast on 3. */
function input(changes: Partial<TradeInput> = {}): TradeInput {
  const span = changes.spanEntries ?? granolaEntries();
  return {
    motive: 'protein',
    goal: 'fatLoss',
    spanEntries: span,
    history: [...span, ...logged(yogurt, [-20, -9, 3])],
    catalog: undefined,
    safeguards: safe,
    cautions: new Set(),
    activeSignals: new Set(),
    calorieRoom: false,
    spanDays: 14,
    ...changes,
  };
}

describe('findTrade (MM-607)', () => {
  it("a trade from the person's own foods", () => {
    const trade = findTrade(input());
    expect(trade?.x.name).toBe('Granola');
    expect(trade?.y.name).toBe('Greek yogurt with berries');
    expect(trade?.source).toBe('logged');
    expect(trade?.meal).toBe('breakfast');
    expect(trade?.days).toBe(6);
    // 19 g more on 6 of 14 days: about 8 g a day, at 90 kcal less a time.
    expect(trade?.gainPerDay).toBeCloseTo((19 * 6) / 14);
    expect(Math.round(trade?.gainPerDay ?? 0)).toBe(8);
    expect(trade?.deltaKcal).toBe(-90);
  });

  it('a catalog trade, in the granola’s group, meeting every matching rule', () => {
    const proteinGranola = cereal('Protein granola', 380, 25, 40, 12);
    const tooSmall = cereal('Puffed wheat', 200, 18, 25, 2);
    const trade = findTrade(
      input({ history: granolaEntries(), catalog: catalog(proteinGranola, tooSmall) }),
    );
    expect(trade?.source).toBe('catalog');
    expect(trade?.y.name).toBe('Protein granola');
    if (trade === undefined) return;
    const { x, y } = trade;
    expect(y.kcal).toBeGreaterThanOrEqual(0.6 * x.kcal);
    expect(y.kcal).toBeLessThanOrEqual(1.1 * x.kcal);
    expect((100 * y.proteinG) / y.kcal - (100 * x.proteinG) / x.kcal).toBeGreaterThanOrEqual(3);
    expect(y.proteinG - x.proteinG).toBeGreaterThanOrEqual(8);
  });

  it('no catalog trade without a catalog, or for a food not from it', () => {
    const proteinGranola = cereal('Protein granola', 380, 25, 40, 12);
    expect(findTrade(input({ history: granolaEntries() }))).toBeUndefined();
    const saved = logged({ ...granola, packId: 'custom' }, granolaDays);
    expect(findTrade(input({ spanEntries: saved, history: saved, catalog: catalog(proteinGranola) }))).toBeUndefined();
  });

  it("own foods first: the catalog's better food is only the second", () => {
    const proteinCereal = cereal('High-protein cereal', 400, 40, 40, 9);
    const trades = findTrades(input({ catalog: catalog(proteinCereal) }));
    expect(trades.map((t) => [t.y.name, t.source])).toEqual([
      ['Greek yogurt with berries', 'logged'],
      ['High-protein cereal', 'catalog'],
    ]);
    expect(findTrade(input({ catalog: catalog(proteinCereal) }))?.y.name).toBe('Greek yogurt with berries');
  });

  it('a saved food logged once in the slot comes after a food logged on two days, and before the catalog', () => {
    const shake: Food = { name: 'My protein shake', meal: 'breakfast', kcal: 300, proteinG: 40, carbsG: 20, fatG: 6, foodId: 7, packId: 'custom' };
    const span = granolaEntries();
    const trades = findTrades(
      input({ history: [...span, ...logged(yogurt, [-20, 3]), ...logged(shake, [-5])], catalog: catalog(cereal('High-protein cereal', 400, 40, 40, 9)) }),
    );
    expect(trades.map((t) => t.source)).toEqual(['logged', 'saved', 'catalog']);
  });

  it('not eat less in disguise: a Y with half of X’s calories is rejected', () => {
    const halfShake: Food = { name: 'Protein shake', meal: 'breakfast', kcal: 210, proteinG: 40, carbsG: 8, fatG: 2 };
    const span = granolaEntries();
    expect(findTrade(input({ history: [...span, ...logged(halfShake, [-3, -2])] }))).toBeUndefined();
    const biggerShake: Food = { ...halfShake, kcal: 260, proteinG: 45, carbsG: 15 };
    expect(findTrade(input({ history: [...span, ...logged(biggerShake, [-3, -2])] }))?.y.name).toBe('Protein shake');
  });

  it('on lean gain, Y keeps at least 90% of the calories', () => {
    expect(findTrade(input({ goal: 'leanGain' }))).toBeUndefined();
    const bigger: Food = { ...yogurt, name: 'Yogurt bowl', kcal: 440, proteinG: 32, carbsG: 56, fatG: 10 };
    const span = granolaEntries();
    expect(findTrade(input({ goal: 'leanGain', history: [...span, ...logged(bigger, [-3, -2])] }))?.y.name).toBe('Yogurt bowl');
  });

  it('a lean protein food is never X for a protein or fat trade', () => {
    // Fat under 40% of its energy, and neither breaded nor fried: chicken breast would be a fat trade if it could be X.
    const meatballs: Food = { name: 'Turkey meatballs', meal: 'lunch', kcal: 300, proteinG: 40, carbsG: 10, fatG: 12.4 };
    const breast: Food = { name: 'Chicken breast', meal: 'lunch', kcal: 280, proteinG: 45, carbsG: 15, fatG: 4 };
    const span = logged(meatballs, granolaDays);
    const history = [...span, ...logged(breast, [-4, -2, 1])];
    expect(findTrade(input({ motive: 'fat', spanEntries: span, history }))).toBeUndefined();
    expect(findTrade(input({ motive: 'protein', spanEntries: span, history }))).toBeUndefined();
    expect(findTrade(input({ motive: 'calories', spanEntries: span, history }))).toBeUndefined();
  });

  it('a protein food that is breaded or fried, or mostly fat, can be X (MM-617)', () => {
    // Chicken thigh with the skin: 66% of its macros' energy from fat.
    const thigh: Food = { name: 'Chicken thigh', meal: 'lunch', kcal: 300, proteinG: 25, carbsG: 0, fatG: 22 };
    const breast: Food = { name: 'Chicken breast', meal: 'lunch', kcal: 250, proteinG: 45, carbsG: 1, fatG: 6 };
    const span = logged(thigh, granolaDays);
    const history = [...span, ...logged(breast, [-4, -2, 1])];
    expect(findTrade(input({ motive: 'fat', spanEntries: span, history }))).toMatchObject({ x: { name: 'Chicken thigh' }, y: { name: 'Chicken breast' } });
    // A breaded cutlet with fat a third of its energy: replaceable because it is breaded.
    const cutlet: Food = { name: 'Breaded chicken cutlet', meal: 'lunch', kcal: 350, proteinG: 35, carbsG: 25, fatG: 12 };
    const grilled: Food = { name: 'Grilled chicken breast', meal: 'lunch', kcal: 280, proteinG: 50, carbsG: 0, fatG: 6 };
    const cutlets = logged(cutlet, granolaDays);
    const withGrilled = [...cutlets, ...logged(grilled, [-4, -2, 1])];
    expect(findTrade(input({ motive: 'protein', spanEntries: cutlets, history: withGrilled }))).toMatchObject({
      x: { name: 'Breaded chicken cutlet' },
      y: { name: 'Grilled chicken breast' },
    });
  });

  it('a fat trade keeps protein and lowers the fat share', () => {
    const span = granolaEntries();
    const trade = findTrade(input({ motive: 'fat', history: [...span, ...logged(porridge, [-3, -1])] }));
    expect(trade?.y.name).toBe('Oat porridge with milk');
    expect(trade?.gainPerDay).toBeCloseTo((10 * 6) / 14);
  });

  it('a calorie trade is at least 80 kcal less and keeps protein', () => {
    expect(findTrade(input({ motive: 'calories' }))?.y.name).toBe('Greek yogurt with berries');
    const close: Food = { ...yogurt, name: 'Skyr bowl', kcal: 360, proteinG: 28, carbsG: 49 };
    const span = granolaEntries();
    expect(findTrade(input({ motive: 'calories', history: [...span, ...logged(close, [-3, -1])] }))).toBeUndefined();
  });

  it('a sodium trade has at most 70% of the sodium per 100 kcal', () => {
    const salty: Food = { ...granola, name: 'Instant noodles', meal: 'lunch', sodiumMg: 1400, foodId: undefined };
    const soup: Food = { name: 'Lentil soup, homemade', meal: 'lunch', kcal: 380, proteinG: 20, carbsG: 55, fatG: 8, sodiumMg: 500 };
    const span = logged(salty, granolaDays);
    const trade = findTrade(input({ motive: 'sodium', spanEntries: span, history: [...span, ...logged(soup, [-3, -1])] }));
    expect(trade?.y.name).toBe('Lentil soup, homemade');
    expect(trade?.gainPerDay).toBeCloseTo((900 * 6) / 14);
  });

  it('no room, no add: fat loss over target with no qualifying Y gives no trade, never an "eat less"', () => {
    const trade = findTrade(input({ motive: 'calories', history: granolaEntries(), calorieRoom: false }));
    expect(trade).toBeUndefined();
  });

  it('does no harm to other findings in change', () => {
    const saltyYogurt: Food = { ...yogurt, sodiumMg: 400 };
    const span = granolaEntries();
    const history = [...span, ...logged(saltyYogurt, [-3, -1])];
    expect(findTrade(input({ history }))?.y.name).toBe('Greek yogurt with berries');
    expect(findTrade(input({ history, activeSignals: new Set(['sodium']) }))).toBeUndefined();
    const lowFiber: Food = { ...yogurt, fiberG: 1 };
    const fiberHistory = [...span, ...logged(lowFiber, [-3, -1])];
    expect(findTrade(input({ history: fiberHistory }))).toBeDefined();
    expect(findTrade(input({ history: fiberHistory, activeSignals: new Set(['fiber']) }))).toBeUndefined();
  });

  it('Y is never itself mostly fat', () => {
    // 90 kcal less with protein kept would be a calorie trade, but 60% of its calories are fat.
    const nuts: Food = { name: 'Nut butter toast', meal: 'breakfast', kcal: 330, proteinG: 10, carbsG: 20, fatG: 22 };
    const span = granolaEntries();
    expect(findTrade(input({ motive: 'calories', history: [...span, ...logged(nuts, [-3, -1])] }))).toBeUndefined();
  });

  it('an estimate, alcohol, a snoozed food or a small food is never X', () => {
    const estimated = logged({ ...granola, source: 'quickAdd' }, granolaDays);
    expect(findTrade(input({ spanEntries: estimated, history: [...estimated, ...logged(yogurt, [-3, -1])] }))).toBeUndefined();
    const wine: Food = { name: 'Red wine', meal: 'breakfast', kcal: 250, proteinG: 0, carbsG: 8, fatG: 0, alcoholG: 31 };
    const wineSpan = logged(wine, granolaDays);
    expect(findTrade(input({ spanEntries: wineSpan, history: [...wineSpan, ...logged(yogurt, [-3, -1])] }))).toBeUndefined();
    expect(findTrade(input({ snoozed: new Set(['granola']) }))).toBeUndefined();
    const twoDays = logged(granola, [0, 2]);
    expect(findTrade(input({ spanEntries: twoDays, history: [...twoDays, ...logged(yogurt, [-3, -1])] }))).toBeUndefined();
  });

  it("X is never the top source of a micronutrient under its reference", () => {
    const ironGranola = logged({ ...granola, micros: Micronutrients.none.with('iron', 6) }, granolaDays);
    const history = [...ironGranola, ...logged(yogurt, [-3, -1])];
    expect(findTrade(input({ spanEntries: ironGranola, history }))).toBeDefined();
    expect(findTrade(input({ spanEntries: ironGranola, history, microReferences: new Map([['iron', 18]]) }))).toBeUndefined();
  });

  describe('safeguards', () => {
    const quiet = (changes: Partial<TradeInput>) =>
      (['protein', 'fat', 'calories', 'sodium'] as const).map((motive) => findTrade(input({ ...changes, motive })));
    const cautions = (...list: Caution[]) => new Set<Caution>(list);

    it('an eating-disorder history names no food at all', () => {
      expect(quiet({ safeguards: { ...safe, eatingDisorderHistory: true } })).toEqual([undefined, undefined, undefined, undefined]);
      expect(quiet({ cautions: cautions('eatingDisorderHistory') })).toEqual([undefined, undefined, undefined, undefined]);
    });

    it('under 18, paused, under-eating or after bariatric surgery: no trade', () => {
      for (const safeguards of [{ ...safe, adult: false }, { ...safe, paused: true }, { ...safe, underEating: true }]) {
        expect(findTrade(input({ safeguards }))).toBeUndefined();
      }
      expect(findTrade(input({ cautions: cautions('bariatricSurgery') }))).toBeUndefined();
    });

    it('kidney disease: no trade for protein, though a fat trade may be', () => {
      const span = granolaEntries();
      const history = [...span, ...logged(yogurt, [-3, -1]), ...logged(porridge, [-3, -1])];
      expect(findTrade(input({ history, cautions: cautions('chronicKidneyDisease') }))).toBeUndefined();
      expect(findTrade(input({ history, safeguards: { ...safe, cautions: cautions('chronicKidneyDisease') } }))).toBeUndefined();
      expect(findTrade(input({ motive: 'fat', history, cautions: cautions('chronicKidneyDisease') }))).toBeDefined();
    });

    it('insulin or a sulfonylurea: no carbohydrate-lowering trade', () => {
      expect(findTrade(input({ cautions: cautions('insulinOrSulfonylurea') }))).toBeUndefined();
    });

    it('pregnancy, breastfeeding, underweight and low body weight: no calorie-lowering trade', () => {
      for (const caution of ['pregnancy', 'breastfeeding', 'underweight', 'lowBodyWeight'] as const) {
        expect(findTrade(input({ cautions: cautions(caution) }))).toBeUndefined();
      }
      const bigger: Food = { ...yogurt, name: 'Yogurt bowl', kcal: 440, proteinG: 32, carbsG: 56, fatG: 10 };
      const span = granolaEntries();
      expect(findTrade(input({ history: [...span, ...logged(bigger, [-3, -2])], cautions: cautions('pregnancy') }))?.y.name).toBe(
        'Yogurt bowl',
      );
    });

    it("no trade takes the span's average under the calorie floor", () => {
      // The span averages 6 × 420 / 14 = 180 kcal; the trade takes 6 × 90 / 14 ≈ 39 off.
      expect(findTrade(input({ calorieFloorKcal: 100 }))).toBeDefined();
      expect(findTrade(input({ calorieFloorKcal: 150 }))).toBeUndefined();
    });
  });

  it('edits recompute: with the entries of X deleted, the trade no longer names X', () => {
    const span = granolaEntries();
    const history = [...span, ...logged(yogurt, [-20, -9, 3])];
    expect(findTrade(input({ spanEntries: span, history }))?.x.name).toBe('Granola');
    const kept = span.slice(0, 2);
    const after = findTrade(input({ spanEntries: kept, history: history.filter((e) => !span.slice(2).includes(e)) }));
    expect(after?.x.name).not.toBe('Granola');
  });
});
