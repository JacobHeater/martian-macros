import type { CoachAdvice } from '../CoachAdvice';
import { CoachAdviceRule } from '../CoachAdviceRule';
import type { CoachFinding } from '../CoachFinding';
import type { FoodTag } from '../language/FoodTag';
import { foodTagsOf } from '../language/foodTagsOf';
import { adviceFoodOf } from './adviceFoodOf';
import { allowedOrders } from './allowedOrders';
import type { DayAdviceContext } from './DayAdviceContext';
import type { DayUnit } from './DayUnit';
import { saucedOrFried } from './saucedOrFried';
import { tradeAdviceOf } from './tradeAdviceOf';

const R = CoachAdviceRule;

/** Foods never told "does nothing for your goal": what they bring is not protein. */
const notSkipped: readonly FoodTag[] = ['fruit', 'vegetable', 'salad', 'legume'];

/** At most this many "high-calorie, low-protein" swaps on one line. */
const swapsMost = 2;

/**
 * The orders a 1d finding ends in (MM-617), after the safeguards
 * (`allowedOrders`). `named` holds the food keys the calorie line has
 * already ordered, so the protein line does not order them again.
 *
 * - **Calories or fat over** (the calorie family): on a day over the band,
 *   the meal breakdown's worst one or two foods skipped ("or take one
 *   spoonful" in a logged meal of 3 foods or more, the food to fill the
 *   plate with, and what the day would be without each), then their swaps
 *   (`swapFor`); MM-607's trade; else the top food swapped or halved.
 * - **Protein per 100 kcal**: the trade; up to two high-calorie,
 *   low-protein meals or foods swapped; each food under 2 g protein per
 *   100 kcal at 150 kcal or more skipped ("does nothing for your goal");
 *   else an add of protein.
 * - **Sodium**: at 1.5× the limit or more, drink water; sauce on the side
 *   when its foods were sauced or fried; under 1.5×, the top food swapped
 *   or halved.
 * - **Fiber**: two cups of vegetables, at dinner if it is not logged.
 * - **What is left**: over target, the rest of today's limit (dinner, or a
 *   snack once dinner is logged; "no sauce" after sauced or fried food);
 *   under it, the protein left, with a food that fits.
 * - **The closing line**: back to the target tomorrow.
 */
export function dayAdviceOf(finding: CoachFinding, c: DayAdviceContext, named: ReadonlySet<string> = new Set()): CoachAdvice[] {
  const unitOf = (name: string): DayUnit | undefined => c.units.find((u) => u.food.key === name.trim().toLowerCase());
  const density = (u: DayUnit) => (u.food.kcal > 0 ? (100 * u.food.proteinG) / u.food.kcal : 0);
  const swapOrHalve = (u: DayUnit | undefined): CoachAdvice[] => {
    if (u === undefined) return [];
    const replacement = c.swap(u);
    const at = { food: u.food, meal: u.meal, mealName: u.mealName };
    return replacement === undefined ? [{ kind: 'halve', ...at }] : [{ kind: 'swap', ...at, replacement }];
  };
  const trade: CoachAdvice[] = finding.trade === undefined ? [] : [tradeAdviceOf(finding.trade)];
  const top = finding.foods[0];
  const fit = c.fits[0];
  const proteinAdd: CoachAdvice = {
    kind: 'add',
    nutrient: 'protein',
    ...(c.proteinLeftG > 0 ? { amountG: c.proteinLeftG } : {}),
    ...(fit === undefined || c.kcalLeft <= 0 ? {} : { addFood: fit.name }),
  };

  switch (finding.kind === 'fix' ? finding.signal : finding.kind) {
    case 'calories':
    case 'fatAgainstTarget': {
      const b = c.breakdown;
      const orders: CoachAdvice[] = [];
      if (b !== undefined) {
        const foods = b.worst.map((e) => ({ e, food: adviceFoodOf(e.name, [e]) }));
        const several = b.name !== undefined && b.entries.length >= R.spoonfulMinFoods;
        for (const { e, food } of foods) {
          orders.push({
            kind: 'skip',
            food,
            meal: b.meal,
            mealName: b.name,
            overKcal: c.overKcal,
            withoutKcalOver: c.overKcal - e.kcal,
            keepFood: b.keep?.name.trim(),
            ...(several ? { orOneSpoonful: true } : {}),
          });
        }
        for (const { food } of foods) {
          const unit = unitOf(food.name);
          const replacement = unit === undefined ? undefined : c.swap(unit);
          if (replacement !== undefined) orders.push({ kind: 'swap', food, replacement, meal: b.meal, mealName: b.name });
        }
      }
      orders.push(...trade);
      if (orders.length === 0) orders.push(...swapOrHalve(top === undefined ? undefined : unitOf(top.name)));
      const fallback: CoachAdvice[] =
        finding.signal === 'calories' || c.overKcal > 0
          ? [{ kind: 'backToPlan', limitKcal: c.targetKcal }]
          : [{ kind: 'halve', nutrient: 'fat' }];
      return allowedOrders(c.limits, orders, fallback);
    }
    case 'proteinDensity': {
      const orders: CoachAdvice[] = [...trade];
      const free = c.units.filter((u) => !named.has(u.food.key) && u.food.key !== trade[0]?.food?.key);
      const lowForTargets = free.filter(
        (u) => u.food.kcal >= R.swapMinKcal && density(u) < R.swapDensityShareOfRequired * c.requiredPer100Kcal,
      );
      let swaps = 0;
      for (const u of lowForTargets) {
        if (swaps >= swapsMost) break;
        const replacement = c.swap(u);
        if (replacement === undefined) continue;
        orders.push({ kind: 'swap', food: u.food, replacement, meal: u.meal, mealName: u.mealName });
        swaps++;
      }
      for (const u of free) {
        if (u.food.kcal < R.lowProteinMinKcal || density(u) >= R.lowProteinPer100Kcal) continue;
        const tags = foodTagsOf(u.food.name);
        if (notSkipped.some((t) => tags.has(t))) continue;
        if (orders.some((o) => o.food?.key === u.food.key)) continue;
        orders.push({ kind: 'skip', food: u.food, meal: u.meal, mealName: u.mealName, lowProtein: true });
      }
      return allowedOrders(c.limits, orders.length > 0 ? orders : [proteinAdd], [{ kind: 'add', nutrient: 'protein' }]);
    }
    case 'sodium': {
      const sodiumMg = finding.figures['sodiumMg'] ?? 0;
      const limitMg = finding.figures['limitMg'] ?? 0;
      const multiple = limitMg > 0 ? sodiumMg / limitMg : 0;
      const orders: CoachAdvice[] = [];
      if (multiple >= R.sodiumMultipleFrom) orders.push({ kind: 'drinkWater', sodiumMultiple: multiple });
      if (finding.foods.some((f) => saucedOrFried(f.name))) orders.push({ kind: 'sauceOnSide' });
      if (multiple < R.sodiumMultipleFrom) {
        orders.push(...(trade.length > 0 ? trade : swapOrHalve(top === undefined ? undefined : unitOf(top.name))));
      }
      return allowedOrders(c.limits, orders, [{ kind: 'drinkWater', sodiumMultiple: multiple }, { kind: 'sauceOnSide' }]);
    }
    case 'fiber':
      return allowedOrders(c.limits, [
        {
          kind: 'add',
          nutrient: 'fiber',
          addCategory: 'vegetables',
          amountCups: R.fiberCups,
          ...(c.dinnerLogged ? {} : { meal: 'dinner' as const }),
        },
      ]);
    case 'left':
      if (c.overKcal > 0) {
        const limit: CoachAdvice = {
          kind: 'limitRestOfDay',
          limitKcal: c.dinnerLogged ? R.snackLimitKcal : R.dinnerLimitKcal,
          meal: c.dinnerLogged ? 'snack' : 'dinner',
          ...(c.sauced ? { noSauce: true } : {}),
        };
        return allowedOrders(c.limits, [limit], c.proteinLeftG > 0 ? [{ kind: 'add', nutrient: 'protein', amountG: c.proteinLeftG }] : []);
      }
      return c.proteinLeftG > 0 ? allowedOrders(c.limits, [{ ...proteinAdd, ...(c.kcalLeft > 0 ? { amountKcal: c.kcalLeft } : {}) }]) : [];
    case 'close':
      return allowedOrders(c.limits, [{ kind: 'backToPlan', limitKcal: c.targetKcal }]);
    default:
      return allowedOrders(c.limits, [...trade], [proteinAdd]);
  }
}
