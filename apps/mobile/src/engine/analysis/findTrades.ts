import type { Caution } from '../../domain/Caution';
import type { FoodEntry } from '../../domain/FoodEntry';
import { FoodGradeLetter } from '../../domain/food/grade/FoodGradeLetter';
import { topSourcesOf } from '../../domain/food/micros/topSourcesOf';
import type { FoodOrigin } from '../../domain/food/portion/FoodOrigin';
import { gramsFor } from '../../domain/food/portion/gramsFor';
import { Meal } from '../../domain/Meal';
import { gradeOfFoodEntry } from '../gradeOfFoodEntry';
import type { CoachTrade } from './CoachTrade';
import type { CoachTradeSource } from './CoachTradeSource';
import type { TradeCatalogFood } from './TradeCatalogFood';
import type { TradeInput } from './TradeInput';
import { TradeRule } from './TradeRule';
import type { TradeTarget } from './TradeTarget';

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
      const gain = gainOf(motive, x.profile, y.profile);
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

function figuresOf(p: Profile): CoachTrade['x'] {
  return { name: p.name, kcal: p.kcal, proteinG: p.proteinG, fatG: p.fatG };
}

/** A lower number is a better grade; an ungraded food comes last. */
function gradeRank(grade: FoodGradeLetter | undefined): number {
  return grade === undefined ? FoodGradeLetter.values.length : FoodGradeLetter.values.indexOf(grade);
}

/** Whether a food's figures can be read: calories, macros explaining most of them, and not a drink of alcohol. */
function readable(p: Profile): boolean {
  if (!(p.kcal > 0)) return false;
  const alcoholKcal = 7 * (p.alcoholG ?? 0);
  const explained = 4 * p.proteinG + 4 * p.carbsG + 9 * p.fatG + alcoholKcal;
  return explained >= TradeRule.knownMacrosShare * p.kcal && alcoholKcal < TradeRule.alcoholShare * p.kcal;
}

const proteinShare = (p: Profile) => (4 * p.proteinG) / p.kcal;
const fatShare = (p: Profile) => (9 * p.fatG) / p.kcal;
const proteinPer100Kcal = (p: Profile) => (100 * p.proteinG) / p.kcal;

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
    grade: grade.kind === 'graded' ? grade.letter : undefined,
  };
}

function profileOfCatalog(food: TradeCatalogFood): Profile {
  return { ...food, name: food.name.trim(), key: keyOf(food.name) };
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

/** The foods that may be X: eaten on enough days, big enough a time, readable, and none the rules spare. */
function xFoods(input: TradeInput, snoozed: ReadonlySet<string>): XFood[] {
  const spared = shortNutrientSources(input);
  const found: XFood[] = [];
  for (const [key, entries] of byFood(input.spanEntries)) {
    if (snoozed.has(key) || spared.has(key)) continue;
    const days = daysOf(entries);
    if (days < TradeRule.xMinDays) continue;
    const profile = profileOf(usual(entries));
    if (profile.kcal < TradeRule.xMinKcal || !readable(profile)) continue;
    const proteinFood = proteinShare(profile) >= TradeRule.proteinFoodShare;
    if (proteinFood && (input.motive === 'protein' || input.motive === 'fat')) continue;
    const origin = entries.find((e) => e.portion?.origin !== undefined)?.portion?.origin;
    found.push({ profile, days, meal: slotOf(entries), origin });
  }
  return found;
}

/** The band of calories Y may have a time, by the goal. */
function targetFor(input: TradeInput, x: Profile): TradeTarget {
  return input.goal === 'leanGain'
    ? { minKcal: TradeRule.leanGainFloorRatio * x.kcal, maxKcal: undefined }
    : { minKcal: TradeRule.kcalFloorRatio * x.kcal, maxKcal: TradeRule.kcalCeilingRatio * x.kcal };
}

/** The foods that may take X's place, in the order they are offered: logged in X's slot, saved, then the catalog. */
function yFoods(input: TradeInput, x: XFood, snoozed: ReadonlySet<string>): YFood[] {
  const target = targetFor(input, x.profile);
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

/** What Y gains over X a time for the motive, or undefined when Y does not meet the motive's rules. */
function gainOf(motive: CoachTrade['motive'], x: Profile, y: Profile): number | undefined {
  switch (motive) {
    case 'protein': {
      const gain = y.proteinG - x.proteinG;
      const denser = proteinPer100Kcal(y) - proteinPer100Kcal(x) >= TradeRule.proteinDensityGainG;
      return denser && gain >= TradeRule.proteinGainG ? gain : undefined;
    }
    case 'fat': {
      const drop = x.fatG - y.fatG;
      const leaner = fatShare(x) - fatShare(y) >= TradeRule.fatShareDrop;
      return leaner && drop >= TradeRule.fatDropG && y.proteinG >= x.proteinG ? drop : undefined;
    }
    case 'calories': {
      const drop = x.kcal - y.kcal;
      if (drop < TradeRule.kcalDrop || y.proteinG < x.proteinG) return undefined;
      if (x.grams !== undefined && y.grams !== undefined && x.grams > 0 && y.grams > 0 && y.kcal / y.grams > x.kcal / x.grams) {
        return undefined;
      }
      return drop;
    }
    case 'sodium': {
      if (x.sodiumMg === undefined || y.sodiumMg === undefined || !(x.sodiumMg > 0)) return undefined;
      const lower = (100 * y.sodiumMg) / y.kcal <= TradeRule.sodiumDensityRatio * ((100 * x.sodiumMg) / x.kcal);
      return lower ? x.sodiumMg - y.sodiumMg : undefined;
    }
  }
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
  const mostlyFat = fatShare(y) >= TradeRule.mostlyFatShare && y.kcal >= TradeRule.mostlyFatMinKcal && proteinShare(y) < TradeRule.proteinFoodShare;
  const lightOnProtein = proteinShare(y) < TradeRule.lightOnProteinShare && y.kcal >= TradeRule.lightOnProteinMinKcal;
  return !mostlyFat && !lightOnProtein;
}
