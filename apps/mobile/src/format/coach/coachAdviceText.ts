import { Fmt } from '../Fmt';
import { minutesText } from '../minutesText';
import { MuscleGroup } from '../../domain/training/MuscleGroup';
import type { CoachAdvice } from '../../engine/analysis/CoachAdvice';
import type { CoachAdviceFood } from '../../engine/analysis/CoachAdviceFood';
import type { CoachAdviceReplacement } from '../../engine/analysis/CoachAdviceReplacement';
import type { CoachFinding } from '../../engine/analysis/CoachFinding';
import { toStringAsFixed } from '../../lang/toStringAsFixed';
import { muscleGroupLabel } from '../muscleGroupLabel';
import { waterAmount } from '../waterAmount';
import { coachMealWords } from './coachMealWords';
import { coachPhrase } from './coachPhrase';
import { coachPhraseKey } from './coachPhraseKey';
import type { CoachPhrasingSlot } from './CoachPhrasingSlot';
import { coachTradeText } from './coachTradeText';
import { countWord } from './countWord';
import { foodInSentence } from './foodInSentence';
import { listText } from './listText';
import { pluralText } from './pluralText';

/** A keep food that already has vegetables in it is not told "and steamed vegetables" too. */
const hasVegetables = /\b(vegetables?|veggies?|veg|broccoli|greens|salad|spinach|green beans|bok choy)\b/i;

/**
 * A replacement's figures against the food (MM-617): "about 390 kcal, 24 g
 * protein, less than half the fat". The fat is said as a share where that
 * is plainer than the grams (between a quarter and just over a half of the
 * food's), else in grams. Nothing at all is "no calories".
 */
function figuresOf(r: CoachAdviceReplacement, food: CoachAdviceFood | undefined): string | undefined {
  if (r.kcal === undefined) return undefined;
  if (!(r.kcal > 0.5)) return 'no calories';
  const parts = [`about ${Fmt.kcal(r.kcal)}`];
  if (r.proteinG !== undefined && r.proteinG >= 1) parts.push(`${Fmt.grams(r.proteinG)} protein`);
  if (r.fatG !== undefined && food !== undefined && food.fatG > 0) {
    const ratio = r.fatG / food.fatG;
    parts.push(ratio <= 0.25 || ratio > 0.55 ? `${Fmt.grams(r.fatG)} fat` : ratio < 0.45 ? 'less than half the fat' : 'half the fat');
  }
  return parts.join(', ');
}

/** A replacement's name in a sentence: the swap table's own words, or a food's name as logged, made readable. */
const replacementName = (r: CoachAdviceReplacement) => (r.source === 'table' ? r.name : foodInSentence(r.name));

/** The meal-breakdown skips of one food, with what is said around them: the swap and what the day would be without it. */
interface SkipBlock {
  readonly skip: CoachAdvice;
  readonly food: CoachAdviceFood;
  swap?: CoachAdvice;
}

/**
 * The words of a finding's orders (MM-617), one sentence an order, with
 * what each order needs said before it (the food and its figures) and
 * after it (what the day would have been without it). `sentences` is all
 * of it, in order; `orders` the order sentences alone, every one of them
 * in `sentences`.
 *
 * - **The meal breakdown's worst food** (a skip with `withoutKcalOver`):
 *   "General Tso's chicken was the worst of it: 744 kcal, 33 g fat. Skip it
 *   next time, or take one spoonful. Fill the plate with … first.", its
 *   swap ("Swap in …"), then "Without the General Tso's chicken you'd be
 *   310 kcal over, not 1,054."
 * - **A swap**: the food, then "Swap it for … : about 390 kcal, 24 g
 *   protein, less than half the fat." MM-607's trade is said as its own
 *   sentence (`coachTradeText`).
 * - **A food that does nothing for your goal**: "Cookie butter: 170 kcal, 1
 *   g protein. Does nothing for your goal. Skip it."
 * - **Adds, limits, water, sauce, back to plan and training** as one order
 *   each. Under the protected path (`calm`: an eating-disorder history and
 *   the other protein-only safeguards) protein is the only order, said
 *   plainly.
 */
export function coachAdviceText(
  f: CoachFinding,
  fmt: Fmt,
  { calm = false }: { calm?: boolean } = {},
): { readonly sentences: readonly string[]; readonly orders: readonly string[] } {
  const advice = f.advice ?? [];
  const today = f.span === 1;
  const sentences: string[] = [];
  const orders: string[] = [];
  const used = new Map<CoachPhrasingSlot, number>();
  const say = (slot: CoachPhrasingSlot, values: Readonly<Record<string, string>> = {}): string => {
    const part = used.get(slot) ?? 0;
    used.set(slot, part + 1);
    return coachPhrase(slot, coachPhraseKey(f, part), values);
  };
  const lead = (text: string) => sentences.push(text);
  const order = (text: string) => {
    sentences.push(text);
    orders.push(text);
  };
  const food = (a: CoachAdvice) => (a.food === undefined ? '' : foodInSentence(a.food.name));
  const foodLead = (a: CoachAdvice) => {
    const x = a.food;
    if (x === undefined) return;
    const values = { food: food(a), kcal: Fmt.kcal(x.kcal), fat: Fmt.grams(x.fatG) };
    lead(a.meal !== undefined && today ? say('swapFoodAtMeal', { ...values, meal: coachMealWords(a.meal) }) : say('swapFood', values));
  };
  const trade = f.trade;
  const isTrade = (a: CoachAdvice) =>
    trade !== undefined &&
    a.food !== undefined &&
    a.replacement !== undefined &&
    a.food.key === trade.x.name.trim().toLowerCase() &&
    a.replacement.name === trade.y.name;

  // The worst foods' skips, with the swaps of the same foods that follow them.
  const blocks = new Map<string, SkipBlock>();
  for (const a of advice) {
    if (a.kind === 'skip' && a.food !== undefined && a.withoutKcalOver !== undefined && !blocks.has(a.food.key)) {
      blocks.set(a.food.key, { skip: a, food: a.food });
    }
  }
  for (const a of advice) {
    const block = a.food === undefined ? undefined : blocks.get(a.food.key);
    if (a.kind === 'swap' && block !== undefined && block.swap === undefined && !isTrade(a)) block.swap = a;
  }
  let worst = 0;
  const sayBlock = (block: SkipBlock) => {
    const { skip: a, food: x } = block;
    const name = foodInSentence(x.name);
    lead(say(worst === 0 ? 'worstFood' : 'worstFoodNext', { food: name, kcal: Fmt.kcal(x.kcal), fat: Fmt.grams(x.fatG) }));
    order(say(a.orOneSpoonful === true ? 'orderSkipSpoonful' : 'orderSkip'));
    if (a.keepFood !== undefined && worst === 0) {
      const keep = foodInSentence(a.keepFood);
      order(say(hasVegetables.test(keep) ? 'orderKeepWithVegetables' : 'orderKeep', { keep }));
    }
    // A meal with a better food in it already says what to eat: the swap would name a second one.
    const swap = a.keepFood !== undefined && worst === 0 ? undefined : block.swap;
    if (swap?.replacement !== undefined) {
      const figures = figuresOf(swap.replacement, x);
      const replacement = replacementName(swap.replacement);
      order(figures === undefined ? say('orderSwapPlain', { replacement }) : say('orderSwapIn', { replacement, figures }));
    }
    const without = a.withoutKcalOver ?? 0;
    const day = a.on === undefined ? undefined : Fmt.day(a.on, f.to.addDays(1));
    const over = Fmt.whole(a.overKcal ?? 0);
    if (without >= 0.5) {
      const values = { food: name, without: Fmt.kcal(without), over };
      lead(day === undefined ? say('consequenceOver', values) : say('consequenceOverOn', { ...values, day }));
    } else {
      lead(day === undefined ? say('consequenceOnTarget', { food: name }) : say('consequenceOnTargetOn', { food: name, day }));
    }
    worst++;
  };

  for (const a of advice) {
    const block = a.food === undefined ? undefined : blocks.get(a.food.key);
    if (block !== undefined && (a === block.skip || a === block.swap)) {
      if (a === block.skip) sayBlock(block);
      continue;
    }
    switch (a.kind) {
      case 'skip':
        if (a.lowProtein === true && a.food !== undefined) {
          lead(say('lowProteinFood', { food: food(a), kcal: Fmt.kcal(a.food.kcal), protein: Fmt.grams(a.food.proteinG) }));
          lead(say('lowProteinVerdict'));
          order(say('orderSkipLowProtein'));
        } else {
          foodLead(a);
          order(say('orderSkip'));
        }
        break;
      case 'swap': {
        if (a.replacement === undefined) break;
        if (isTrade(a) && trade !== undefined) {
          order(
            coachTradeText(trade, {
              spanDays: f.figures['tradeDays'] ?? f.span,
              today,
              densityStated: f.signal === 'calorieDensity',
              key: coachPhraseKey(f, 'trade'),
            }),
          );
          break;
        }
        foodLead(a);
        const figures = figuresOf(a.replacement, a.food);
        const replacement = replacementName(a.replacement);
        order(figures === undefined ? say('orderSwapPlain', { replacement }) : say('orderSwap', { replacement, figures }));
        break;
      }
      case 'halve':
        if (a.food !== undefined) {
          foodLead(a);
          order(a.replacement === undefined ? say('orderHalve') : say('orderHalveOrSwap', { replacement: replacementName(a.replacement) }));
        } else {
          order(say(a.nutrient === 'fat' ? 'orderHalveFat' : 'orderHalvePortions'));
        }
        break;
      case 'add':
        order(addText(a));
        break;
      case 'limitRestOfDay':
        order(say('orderLimit', { meal: a.meal === 'snack' ? 'a snack' : coachMealWords(a.meal ?? 'dinner'), limit: Fmt.kcal(a.limitKcal ?? 0) }));
        if (a.noSauce === true) order(say('orderNoSauce'));
        break;
      case 'drinkWater':
        if (a.amountMl !== undefined) order(say('orderWaterTraining', { amount: waterAmount(a.amountMl, fmt.units) }));
        else order(say(a.sodiumMultiple !== undefined && today ? 'orderWater' : 'orderWaterPlain'));
        break;
      case 'sauceOnSide':
        order(say('orderSauceOnSide'));
        break;
      case 'backToPlan':
        if (f.kind === 'close') order(say('close', { target: Fmt.whole(a.limitKcal ?? 0) }));
        else order(a.limitKcal === undefined ? say('orderBackToTarget') : say('orderBackToPlan', { target: Fmt.kcal(a.limitKcal) }));
        break;
      case 'train':
        order((a.sessions ?? 1) <= 1 ? say('orderTrainOnce') : say('orderTrain', { sessions: countWord(a.sessions ?? 2) }));
        break;
      case 'addSets':
        if (a.lifts !== undefined && a.lifts.length > 0) {
          const sets = a.sets ?? 1;
          order(say('orderAddSetsLifts', { more: sets === 1 ? 'one more set' : `${countWord(sets)} more sets`, lifts: listText(a.lifts) }));
        } else {
          const group = MuscleGroup.values.find((g) => g === a.group);
          order(
            say('orderAddSetsGroup', {
              sets: pluralText(a.sets ?? 1, 'hard set'),
              group: group === undefined ? 'that group' : muscleGroupLabel(group).toLowerCase(),
            }),
          );
        }
        break;
      case 'slowDown':
        order(say('orderSlowDown', { rate: `${toStringAsFixed((a.rateFraction ?? 0) * 100, 2).replace(/\.?0+$/, '')}%` }));
        break;
      case 'sleep':
        order(say('orderSleep', { hours: pluralText((a.minutes ?? 420) / 60, 'hour') }));
        break;
      case 'keepLifting':
        order(say('orderKeepLifting'));
        break;
      case 'cardio':
        order(say('orderCardio', { more: minutesText(a.minutes ?? 0) }));
        break;
      case 'steps':
        order(say('orderSteps', { floor: Fmt.whole(a.steps ?? 0), short: Fmt.whole(a.stepsShort ?? 0) }));
        break;
    }
  }
  return { sentences, orders };

  function addText(a: CoachAdvice): string {
    if (a.addCategory === 'leanProtein') return say('orderLeanProtein');
    if (a.addCategory === 'vegetables' || a.nutrient === 'fiber') {
      const count = a.amountCups ?? 2;
      const cups = `${countWord(count)} ${count === 1 ? 'cup' : 'cups'}`;
      if (a.addFood !== undefined) return say('orderVegetablesWithFood', { cups, food: foodInSentence(a.addFood) });
      if (a.meal !== undefined) return say('orderVegetablesAt', { cups, meal: coachMealWords(a.meal) });
      return say(today ? 'orderVegetablesToday' : 'orderVegetablesDaily', { cups });
    }
    switch (a.nutrient) {
      case 'fat':
        return say('orderFat');
      case 'carbohydrate':
        return say('orderCarbohydrate');
      case 'calories':
        return say('orderCalories', { kcal: Fmt.kcal(a.amountKcal ?? 0) });
      default: {
        if (calm) return say('orderProteinCalm');
        if (a.days !== undefined) return say('orderProteinDays', { days: a.days === 'rest' ? 'rest days' : 'training days' });
        const fit = a.addFood === undefined ? undefined : f.foods.find((x) => x.name === a.addFood);
        const named =
          a.addFood === undefined
            ? undefined
            : fit?.proteinG === undefined
              ? foodInSentence(a.addFood)
              : `your usual ${foodInSentence(a.addFood)} (${Fmt.grams(fit.proteinG)} protein, ${Fmt.kcal(fit.kcal)})`;
        if (a.amountG !== undefined && a.amountG >= 0.5) {
          const amount = Fmt.grams(a.amountG);
          if (a.amountKcal !== undefined && a.amountG * 4 > a.amountKcal) {
            return say('orderProteinUnrecoverable');
          }
          return named === undefined ? say('orderProteinAmount', { amount }) : say('orderProteinAmountFood', { amount, food: named });
        }
        if (named !== undefined) return say('orderProteinFood', { food: named });
        if (a.meal !== undefined) return say('orderProteinAtMeal', { meal: coachMealWords(a.meal) });
        return say(f.signal === 'strengthOnFatLoss' ? 'orderProteinEveryDay' : 'orderProtein');
      }
    }
  }
}
