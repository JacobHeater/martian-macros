import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';

/**
 * The order a 'fix' finding ends in (MM-617): what to do, as data. The
 * words are `format/coachAdviceText`, so the owner can change a sentence
 * without touching the engine. Every fix carries at least one; the
 * safeguards strip what they forbid (`adviceAllowed`).
 *
 * The food keys are `foodKeyOf`'s (the name, trimmed and in lower case), so
 * a later record of the advice given (skip and swap, for the coach's
 * follow-ups) can find the same food again.
 */
export interface CoachAdvice {
  /**
   * Food:
   * - `skip`: don't eat it next time (inside a meal: or take one spoonful).
   *   With `withoutKcalOver`, the meal breakdown's worst food; without it, a
   *   food that "does nothing for your goal" (`lowProtein`).
   * - `halve`: eat half of it (or swap it, with `replacement`); with no
   *   `food`, halve what `nutrient` names (fat: the added fats).
   * - `swap`: eat `replacement` in its place.
   * - `add`: add `addFood`, or `addCategory`, or a food for `nutrient`.
   * - `limitRestOfDay`: the day is done; at most `limitKcal` more, at `meal`.
   * - `drinkWater`: after a salty day; or, from training, `amountMl` on `days`.
   * - `sauceOnSide`: sauce and dressing on the side.
   * - `backToPlan`: back to `limitKcal`, the target, without making up.
   *
   * Training (MM-609's fixes):
   * - `train`: `sessions` this week.
   * - `addSets`: `sets` more hard sets a week for `group`, or one more set a
   *   session on each of `lifts`.
   * - `slowDown`: lose at `rateFraction` of body weight a week instead.
   * - `sleep`: sleep at least `minutes` a night.
   * - `keepLifting`: keep the loads; cut sets before weight.
   */
  readonly kind:
    | 'skip'
    | 'halve'
    | 'swap'
    | 'add'
    | 'limitRestOfDay'
    | 'drinkWater'
    | 'sauceOnSide'
    | 'backToPlan'
    | 'train'
    | 'addSets'
    | 'slowDown'
    | 'sleep'
    | 'keepLifting';
  /** The food the order is about, at the portion eaten (a time). */
  readonly food?:
    | {
        readonly key: string;
        readonly name: string;
        readonly kcal: number;
        readonly fatG: number;
        readonly proteinG: number;
        readonly sodiumMg?: number | undefined;
        /** A meal logged as one (MM-587) rather than a single food. */
        readonly meal?: boolean | undefined;
      }
    | undefined;
  /**
   * What to eat in its place, a time: a food the person logs or saved, a
   * catalog food (MM-607's trade), or a row of the coach's swap table, whose
   * `name` is then the row's key (`coachSwapTable`) and whose words are in
   * `format/`.
   */
  readonly replacement?:
    | {
        readonly name: string;
        readonly kcal?: number | undefined;
        readonly proteinG?: number | undefined;
        readonly fatG?: number | undefined;
        readonly source: 'logged' | 'saved' | 'catalog' | 'table';
      }
    | undefined;
  /** For a skip or a halve: what the day would be over its target without the food (or with half of it); negative is under. */
  readonly withoutKcalOver?: number | undefined;
  /** The day's calories over its target, beside `withoutKcalOver`. */
  readonly overKcal?: number | undefined;
  /** `limitRestOfDay`: the most to eat for the rest of today. `backToPlan`: the target to go back to. */
  readonly limitKcal?: number | undefined;
  /** `add`: a food the person logs, by name. */
  readonly addFood?: string | undefined;
  /** `add`: a kind of food, when the add names none of the person's: vegetables ("two cups at dinner"), lean protein. */
  readonly addCategory?: 'vegetables' | 'leanProtein' | undefined;
  /** `add` of `addCategory` vegetables: about how many cups. */
  readonly amountCups?: number | undefined;
  /** `add`: what the add is for, when it names no food of the person's. `halve` with no food: what to halve. */
  readonly nutrient?: 'protein' | 'fiber' | 'fat' | 'carbohydrate' | 'calories' | undefined;
  /** `add` of calories: about how much a day. `add` of protein for the rest of today: the calories left for it. */
  readonly amountKcal?: number | undefined;
  /** `add` of protein for the rest of today: the grams left to the target. */
  readonly amountG?: number | undefined;
  /** `skip` inside a meal of several foods: the food of it to fill the plate with, the most protein for its calories. */
  readonly keepFood?: string | undefined;
  /** `skip` inside a meal of several foods: "or take one spoonful". */
  readonly orOneSpoonful?: boolean | undefined;
  /** `skip` of a food under `CoachAdviceRule.lowProteinPer100Kcal`: "does nothing for your goal". */
  readonly lowProtein?: boolean | undefined;
  /** Where the order applies: the meal a food was eaten at, `limitRestOfDay`'s next meal, an add's meal. */
  readonly meal?: Meal | undefined;
  /** The meal logged as one (MM-587) that the food was one of, by name ("Chinese buffet"). */
  readonly mealName?: string | undefined;
  /** On a span: the day the food was eaten, when one day drove the span (the meal breakdown of that day). */
  readonly on?: CalendarDate | undefined;
  /** `limitRestOfDay`: "No sauce", said when the day's foods were sauced or fried. */
  readonly noSauce?: boolean | undefined;
  /** `drinkWater` after a salty day: sodium as a multiple of the limit. */
  readonly sodiumMultiple?: number | undefined;
  /** `train`: how many sessions this week. */
  readonly sessions?: number | undefined;
  /** `addSets`: how many more hard sets (a week for `group`, a session for each of `lifts`). */
  readonly sets?: number | undefined;
  /** `addSets`: the muscle group, by id (`MuscleGroup`). */
  readonly group?: string | undefined;
  /** `addSets` for stalled lifts: the lifts, as their strength trend names them. */
  readonly lifts?: readonly string[] | undefined;
  /** `slowDown`: the weekly rate to lose at, a fraction of body weight. */
  readonly rateFraction?: number | undefined;
  /** `sleep`: the least to sleep a night, in minutes. */
  readonly minutes?: number | undefined;
  /** `drinkWater` from training: the day's goal in ml. */
  readonly amountMl?: number | undefined;
  /** An add or water on these days only: training days or rest days. */
  readonly days?: 'training' | 'rest' | undefined;
}
