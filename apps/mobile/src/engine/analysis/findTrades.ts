import type { Caution } from '../../domain/Caution';
import type { FoodEntry } from '../../domain/FoodEntry';
import { FoodGradeLetter } from '../../domain/food/grade/FoodGradeLetter';
import { topSourcesOf } from '../../domain/food/micros/topSourcesOf';
import type { FoodOrigin } from '../../domain/food/portion/FoodOrigin';
import type { Portion } from '../../domain/food/portion/Portion';
import { gramsFor } from '../../domain/food/portion/gramsFor';
import { Meal } from '../../domain/Meal';
import { gradeOfFoodEntry } from '../gradeOfFoodEntry';
import type { CoachTrade } from './CoachTrade';
import type { CoachTradeFood } from './CoachTradeFood';
import type { CoachTradeSource } from './CoachTradeSource';
import { breadedOrFried } from './swap/breadedOrFried';
import { readableFood } from './swap/readableFood';
import { tradeGainOf } from './swap/tradeGainOf';
import { tradeTargetFor } from './swap/tradeTargetFor';
import { unbalancedFood } from './swap/unbalancedFood';
import type { TradeCatalogFood } from './TradeCatalogFood';
import type { TradeInput } from './TradeInput';
import { TradeRule } from './TradeRule';

/** A food at the person's usual portion, or a catalog food at its default serving. */
interface Profile {
  readonly name: string;
  readonly key: string;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly sodiumMg: number | undefined;
  readonly fiberG: number | undefined;
  readonly alcoholG: number | undefined;
  readonly grams: number | undefined;
  /** The portion as logged (the usual instance's); a catalog food has none, only its serving's grams. */
  readonly portion: Portion | undefined;
  readonly grade: FoodGradeLetter | undefined;
}

/** A food that could be traded away, with where and how often it was eaten. */
interface XFood {
  readonly profile: Profile;
  readonly days: number;
  readonly meal: Meal;
  readonly origin: FoodOrigin | undefined;
}

/** A food that could take X's place: own foods first (the tier), then the more familiar. */
interface YFood {
  readonly profile: Profile;
  readonly source: CoachTradeSource;
  readonly tier: number;
  readonly familiarity: number;
}

interface Ranked {
  readonly trade: CoachTrade;
  readonly tier: number;
  readonly score: number;
  readonly familiarity: number;
  readonly grade: number;
}

/** Cautions under which no trade lowers calories (MM-607). */
const noLowering: readonly Caution[] = ['pregnancy', 'breastfeeding', 'underweight', 'lowBodyWeight'];

const keyOf = (name: string) => name.trim().toLowerCase();

/**
 * Every trade X for Y the span allows (MM-607), best first: the person's
 * own foods logged in X's meal slot, then their saved foods and recipes
 * logged there, then a catalog food in X's food group, each Y once at its
 * best. Within a source, by the days X was eaten times the gain a time, then
 * the more familiar Y, then the better grade. Each food is at the person's
 * usual portion (the median of their logged instances) or the catalog's
 * default serving, never rescaled. Empty under any safeguard that keeps food
 * composition quiet, and always empty with an eating-disorder history: no
 * food is named. `findTrade` takes the first; a second is for "The numbers
 * behind this".
 */
export function findTrades(input: TradeInput): CoachTrade[] {
  const { motive, safeguards, spanDays } = input;
  const cautions = new Set<Caution>([...safeguards.cautions, ...input.cautions]);
  if (!safeguards.adult || safeguards.paused || safeguards.underEating || safeguards.eatingDisorderHistory) return [];
  if (cautions.has('eatingDisorderHistory') || cautions.has('bariatricSurgery')) return [];
  if (!(spanDays > 0)) return [];
  if (motive === 'protein' && cautions.has('chronicKidneyDisease')) return [];
  const lowerNot = noLowering.some((c) => cautions.has(c));
  if (lowerNot && motive === 'calories') return [];

  const snoozed = input.snoozed ?? new Set<string>();
  const averageKcal = input.spanEntries.reduce((s, e) => s + e.kcal, 0) / spanDays;
  const ranked: Ranked[] = [];
  for (const x of xFoods(input, snoozed)) {
    for (const y of yFoods(input, x, snoozed)) {
      const gain = tradeGainOf(motive, x.profile, y.profile);
      if (gain === undefined) continue;
      const deltaKcal = y.profile.kcal - x.profile.kcal;
      if (!harmless(input, x.profile, y.profile)) continue;
      if (cautions.has('insulinOrSulfonylurea') && y.profile.carbsG < x.profile.carbsG - TradeRule.insulinCarbDropG) continue;
      if (lowerNot && deltaKcal < 0) continue;
      const floor = input.calorieFloorKcal;
      if (floor !== undefined && deltaKcal < 0 && averageKcal + (deltaKcal * x.days) / spanDays < floor) continue;
      ranked.push({
        trade: {
          motive,
          meal: x.meal,
          x: figuresOf(x.profile),
          y: figuresOf(y.profile),
          source: y.source,
          days: x.days,
          gainPerDay: (gain * x.days) / spanDays,
          deltaKcal,
        },
        tier: y.tier,
        score: gain * x.days,
        familiarity: y.familiarity,
        grade: gradeRank(y.profile.grade),
      });
    }
  }
  ranked.sort(
    (a, b) => a.tier - b.tier || b.score - a.score || b.familiarity - a.familiarity || a.grade - b.grade,
  );
  const seen = new Set<string>();
  const trades: CoachTrade[] = [];
  for (const r of ranked) {
    const key = keyOf(r.trade.y.name);
    if (seen.has(key)) continue;
    seen.add(key);
    trades.push(r.trade);
  }
  return trades;
}

/** A side of the trade at the portion picked: its figures, its sodium where stated, and the portion itself for the words. */
function figuresOf(p: Profile): CoachTradeFood {
  return { name: p.name, kcal: p.kcal, proteinG: p.proteinG, fatG: p.fatG, sodiumMg: p.sodiumMg, portion: p.portion, grams: p.grams };
}

/** A lower number is a better grade; an ungraded food comes last. */
function gradeRank(grade: FoodGradeLetter | undefined): number {
  return grade === undefined ? FoodGradeLetter.values.length : FoodGradeLetter.values.indexOf(grade);
}

const readable = (p: Profile) => readableFood(p);
const proteinShare = (p: Profile) => (4 * p.proteinG) / p.kcal;
/** Fat's share of the energy its macros give: a breaded food's label rarely adds up to its calories. */
const macroFatShare = (p: Profile) => {
  const macros = 4 * p.proteinG + 4 * p.carbsG + 9 * p.fatG;
  return macros > 0 ? (9 * p.fatG) / macros : 0;
};

function profileOf(entry: FoodEntry): Profile {
  const grade = gradeOfFoodEntry(entry);
  return {
    name: entry.name.trim(),
    key: keyOf(entry.name),
    kcal: entry.kcal,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
    sodiumMg: entry.sodiumMg,
    fiberG: entry.fiberG,
    alcoholG: entry.alcoholG,
    grams: gramsOf(entry),
    portion: entry.portion,
    grade: grade.kind === 'graded' ? grade.letter : undefined,
  };
}

function profileOfCatalog(food: TradeCatalogFood): Profile {
  return { ...food, name: food.name.trim(), key: keyOf(food.name), portion: undefined };
}

/** The grams an entry was logged as, when they can be known. */
function gramsOf(entry: FoodEntry): number | undefined {
  const portion = entry.portion;
  if (portion === undefined || portion.quantity === undefined || portion.unit === undefined) return undefined;
  if (portion.impliedGrams !== undefined) return portion.impliedGrams;
  if (portion.reference === undefined) return undefined;
  return gramsFor(portion.quantity, portion.unit, portion.reference);
}

/** The instance at the median of the calories (the lower middle of an even count): the usual portion. */
function usual(entries: readonly FoodEntry[]): FoodEntry {
  const sorted = [...entries].sort((a, b) => a.kcal - b.kcal);
  return sorted[Math.floor((sorted.length - 1) / 2)] as FoodEntry;
}

/** A food's entries by name, estimates left out. */
function byFood(entries: readonly FoodEntry[]): Map<string, FoodEntry[]> {
  const foods = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    if (e.source === 'quickAdd' || !(e.kcal > 0)) continue;
    const key = keyOf(e.name);
    const list = foods.get(key);
    if (list === undefined) foods.set(key, [e]);
    else list.push(e);
  }
  return foods;
}

const daysOf = (entries: readonly FoodEntry[]) => new Set(entries.map((e) => e.date.toString())).size;

/** The meal slot a food is most often eaten in; a tie goes to the earlier meal. */
function slotOf(entries: readonly FoodEntry[]): Meal {
  let best: Meal = entries[0]?.meal ?? 'breakfast';
  let most = 0;
  for (const meal of Meal.values) {
    const count = entries.filter((e) => e.meal === meal).length;
    if (count > most) {
      best = meal;
      most = count;
    }
  }
  return best;
}

/** The names of the top sources of each micronutrient averaging under its reference over the span. */
function shortNutrientSources(input: TradeInput): Set<string> {
  const keys = new Set<string>();
  const references = input.microReferences;
  if (references === undefined) return keys;
  for (const [nutrient, reference] of references) {
    const total = input.spanEntries.reduce((s, e) => s + (e.micros.of(nutrient) ?? 0), 0);
    if (total / input.spanDays >= reference) continue;
    const top = topSourcesOf(input.spanEntries, nutrient, 1)[0];
    if (top !== undefined) keys.add(keyOf(top.name));
  }
  return keys;
}

/**
 * The foods that may be X: eaten on enough days, big enough a time, readable, and none the rules spare. A span
 * shorter than 3 days asks X to be on each of them: on 1d (MM-612) X is a food logged today.
 */
function xFoods(input: TradeInput, snoozed: ReadonlySet<string>): XFood[] {
  const spared = shortNutrientSources(input);
  const minimumDays = Math.min(TradeRule.xMinDays, input.spanDays);
  const found: XFood[] = [];
  for (const [key, entries] of byFood(input.spanEntries)) {
    if (snoozed.has(key) || spared.has(key)) continue;
    const days = daysOf(entries);
    if (days < minimumDays) continue;
    const profile = profileOf(usual(entries));
    if (profile.kcal < TradeRule.xMinKcal || !readable(profile)) continue;
    // A protein food is never X for a protein or fat trade, unless it is breaded or fried (its name's tags), or fat is a
    // large share of its energy (MM-617): fried chicken, sausage, bacon, chicken thigh with the skin.
    const proteinFood = proteinShare(profile) >= TradeRule.proteinFoodShare;
    const replaceable = breadedOrFried(profile.name) || macroFatShare(profile) >= TradeRule.friedProteinFatShare;
    if (proteinFood && !replaceable && (input.motive === 'protein' || input.motive === 'fat')) continue;
    const origin = entries.find((e) => e.portion?.origin !== undefined)?.portion?.origin;
    found.push({ profile, days, meal: slotOf(entries), origin });
  }
  return found;
}

/** The foods that may take X's place, in the order they are offered: logged in X's slot, saved, then the catalog. */
function yFoods(input: TradeInput, x: XFood, snoozed: ReadonlySet<string>): YFood[] {
  const target = tradeTargetFor(input.goal, x.profile.kcal);
  const inBand = (p: Profile) => p.kcal >= target.minKcal && (target.maxKcal === undefined || p.kcal <= target.maxKcal);
  const own: YFood[] = [];
  const ownKeys = new Set<string>();
  const inSlot = input.history.filter((e) => e.meal === x.meal);
  for (const [key, entries] of byFood(inSlot)) {
    if (key === x.profile.key || snoozed.has(key)) continue;
    const days = daysOf(entries);
    const saved = entries.some((e) => e.portion?.origin?.packId === 'custom');
    const source: CoachTradeSource | undefined = days >= TradeRule.loggedMinDays ? 'logged' : saved ? 'saved' : undefined;
    if (source === undefined) continue;
    ownKeys.add(key);
    const profile = profileOf(usual(entries));
    if (!readable(profile) || !inBand(profile)) continue;
    own.push({ profile, source, tier: source === 'logged' ? 0 : 1, familiarity: days });
  }
  const catalog: YFood[] = [];
  const origin = x.origin;
  if (input.catalog !== undefined && origin !== undefined && origin.packId !== 'custom') {
    const group = input.catalog.groupOf(origin);
    if (group !== undefined) {
      for (const food of input.catalog.candidatesIn(group, target)) {
        const profile = profileOfCatalog(food);
        if (profile.key === x.profile.key || ownKeys.has(profile.key) || snoozed.has(profile.key)) continue;
        if (!readable(profile) || !inBand(profile)) continue;
        catalog.push({ profile, source: 'catalog', tier: 2, familiarity: 0 });
      }
    }
  }
  return [...own, ...catalog];
}

/** Y does no harm on the other findings in change, is no lower a grade band, and is not itself mostly fat or light on protein. */
function harmless(input: TradeInput, x: Profile, y: Profile): boolean {
  if (input.activeSignals.has(TradeRule.sodiumSignal) && x.sodiumMg !== undefined) {
    if (y.sodiumMg === undefined || y.sodiumMg > x.sodiumMg) return false;
  }
  if (input.activeSignals.has(TradeRule.fiberSignal) && x.fiberG !== undefined) {
    if (y.fiberG === undefined || y.fiberG < x.fiberG - TradeRule.fiberDropG) return false;
  }
  if (x.grade !== undefined && y.grade !== undefined && y.grade.charAt(0) > x.grade.charAt(0)) return false;
  return !unbalancedFood(y);
}
