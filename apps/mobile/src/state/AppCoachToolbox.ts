import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import { FoodGroup } from '../domain/food/FoodGroup';
import type { CoachTool } from '../domain/integration/CoachTool';
import type { CoachToolAnswer } from '../domain/integration/CoachToolAnswer';
import type { CoachToolbox } from '../domain/integration/CoachToolbox';
import type { AppCoachToolboxReads } from './AppCoachToolboxReads';
import { Meal } from '../domain/Meal';
import type { FoodAnalysisInput } from '../engine/analysis/food/FoodAnalysisInput';
import { foodKeyOf } from '../engine/analysis/food/foodKeyOf';
import { foodLimitsOf } from '../engine/analysis/food/foodLimitsOf';
import { recordOnOf } from '../engine/analysis/food/recordOnOf';
import { mealMovesOf } from '../engine/analysis/moves/mealMovesOf';
import { FoodSignalRule } from '../engine/analysis/food/FoodSignalRule';
import { mealMoveFigures } from '../engine/analysis/moves/mealMoveFigures';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
const asRecord = (value: unknown): Record<string, unknown> => (value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {});
const asString = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined);
const asNumber = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

/** Every number in a tool's answer, whole, which the model may then say (MM-685). */
function numbersIn(value: unknown): number[] {
  if (typeof value === 'number') return Number.isFinite(value) ? [whole(Math.abs(value))] : [];
  if (Array.isArray(value)) return value.flatMap(numbersIn);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(numbersIn);
  return [];
}

const answer = (result: unknown): CoachToolAnswer => ({ result, numbers: numbersIn(result) });

/** A logged food as the model reads it. */
const foodOf = (e: FoodEntry) => ({ name: e.name.trim(), meal: e.meal, kcal: whole(e.kcal), proteinG: whole(e.proteinG), carbsG: whole(e.carbsG), fatG: whole(e.fatG) });

const searchCatalog: CoachTool = {
  name: 'search_catalog',
  description:
    'Foods in the installed food database by words in their name, each at its default serving with calories and macros. ' +
    'Narrow by group (meatAndPoultry, fish, eggs, dairyAndYogurt, legumes, breadsAndGrains, vegetables, fruit, breakfastCereals, nutsAndSeeds, snacksAndSweets, spreadsAndSauces, fatsAndOils, preparedMeals, drinks), ' +
    'a calorie ceiling, or a least share of calories from protein (percent). Up to 10 foods.',
  input: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Words of the food name; empty lists the group.' },
      group: { type: 'string', description: 'A food group to search within.' },
      maxKcal: { type: 'number', description: 'The most calories a serving may have.' },
      minProteinPercent: { type: 'number', description: 'The least share of calories from protein, in percent.' },
    },
    required: ['query'],
  },
};

const priceMove: CoachTool = {
  name: 'price_move',
  description:
    'Price a move you propose for a logged food, by the app’s own arithmetic: cut it to a share of its portion, add a food beside it, or swap it for another food. ' +
    'Answers the meal and the day after the move, and whether the person’s safeguards allow it.',
  input: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['cutPortion', 'addProtein', 'swapSameGroup'] },
      food: { type: 'string', description: 'The logged food the move is about, by its name as logged.' },
      keepShare: { type: 'number', description: 'cutPortion: the share of the food kept, such as 0.5.' },
      other: {
        type: 'object',
        description: 'addProtein or swapSameGroup: the food added or put in its place, with its calories and protein a serving.',
        properties: { name: { type: 'string' }, kcal: { type: 'number' }, proteinG: { type: 'number' } },
        required: ['name', 'kcal', 'proteinG'],
      },
    },
    required: ['kind', 'food'],
  },
};

const mealAndDay: CoachTool = {
  name: 'meal_and_day',
  description: 'This meal’s foods with calories and macros, the day’s totals so far, the targets, the calories left and the protein still to go.',
  input: { type: 'object', properties: {} },
};

const moves: CoachTool = {
  name: 'moves',
  description: 'The app’s own moves for this meal, ranked by the day’s gap, each priced: cut the portion, add a protein food, a same-group swap, or the next meal’s order. The first is the one the built-in coach orders.',
  input: { type: 'object', properties: {} },
};

const myFoodsAtMeal: CoachTool = {
  name: 'my_foods_at_meal',
  description: 'The foods the person has logged at this meal slot in the last 56 days, each with its usual calories and macros and the days it was logged, the most logged first.',
  input: { type: 'object', properties: {} },
};

const myFoodsAtAnyMeal: CoachTool = {
  name: 'my_foods_at_meal',
  description: 'The foods the person has logged at a meal slot in the last 56 days, each with its usual calories and macros and the days it was logged, the most logged first.',
  input: { type: 'object', properties: { meal: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] } }, required: ['meal'] },
};

const todayMeals: CoachTool = {
  name: 'today_meals',
  description: 'Every meal logged today with its foods, calories and macros, and the day’s totals against the targets.',
  input: { type: 'object', properties: {} },
};

const week: CoachTool = {
  name: 'week',
  description: 'The last seven days: days logged, days on the calorie target, days the protein floor was hit, the average calories and protein, weigh-ins.',
  input: { type: 'object', properties: {} },
};

const training: CoachTool = {
  name: 'training',
  description: 'This week’s lifting sessions against the sessions set, days since the last, and, where held, cardio minutes and steps a day against their floors.',
  input: { type: 'object', properties: {} },
};

/**
 * The tools the coach's model may call (MM-685), answered from the app's
 * own state and engine, never the network: for a meal's breakdown
 * (`forMeal`) and for the day's brief and inline lines (`forDay`). Every
 * number in an answer is one the model may then say.
 */
export class AppCoachToolbox {
  private readonly reads: AppCoachToolboxReads;

  constructor(reads: AppCoachToolboxReads) {
    this.reads = reads;
  }

  forMeal(day: CalendarDate, meal: Meal): CoachToolbox {
    return {
      tools: [mealAndDay, moves, myFoodsAtMeal, searchCatalog, priceMove],
      call: async (name, input) => {
        switch (name) {
          case 'meal_and_day':
            return answer(this.mealAndDay(day, meal));
          case 'moves':
            return answer(this.moves(day, meal));
          case 'my_foods_at_meal':
            return answer(this.myFoodsAt(day, meal));
          case 'search_catalog':
            return answer(await this.searchCatalog(input));
          case 'price_move':
            return answer(this.priceMove(day, input));
          default:
            return answer({ error: `No tool called ${name}.` });
        }
      },
    };
  }

  forDay(day: CalendarDate): CoachToolbox {
    return {
      tools: [todayMeals, week, training, myFoodsAtAnyMeal, searchCatalog, priceMove],
      call: async (name, input) => {
        switch (name) {
          case 'today_meals':
            return answer(this.todayMeals(day));
          case 'week':
            return answer(this.week());
          case 'training':
            return answer(this.training());
          case 'my_foods_at_meal': {
            const meal = asString(asRecord(input).meal);
            return answer(this.myFoodsAt(day, Meal.values.find((m) => m === meal) ?? 'dinner'));
          }
          case 'search_catalog':
            return answer(await this.searchCatalog(input));
          case 'price_move':
            return answer(this.priceMove(day, input));
          default:
            return answer({ error: `No tool called ${name}.` });
        }
      },
    };
  }

  private dayOf(day: CalendarDate): { input: FoodAnalysisInput; entries: FoodEntry[]; kcalTarget: number; proteinTargetG: number } | undefined {
    const input = this.reads.foodInput();
    if (input === undefined) return undefined;
    const record = recordOnOf(input.history)(day);
    const entries = input.entries.filter((e) => e.date.epochDay === day.epochDay);
    return {
      input,
      entries,
      kcalTarget: (record?.targets.kcal ?? 0) * (input.plannedShare?.(day) ?? 1),
      proteinTargetG: record?.targets.proteinG ?? 0,
    };
  }

  private mealAndDay(day: CalendarDate, meal: Meal): unknown {
    const read = this.dayOf(day);
    if (read === undefined) return { error: 'The day is not read yet.' };
    const sum = (entries: readonly FoodEntry[], of: (e: FoodEntry) => number) => entries.reduce((s, e) => s + of(e), 0);
    const inMeal = read.entries.filter((e) => e.meal === meal);
    const dayKcal = sum(read.entries, (e) => e.kcal);
    const dayProteinG = sum(read.entries, (e) => e.proteinG);
    return {
      meal,
      foods: inMeal.map(foodOf),
      mealKcal: whole(sum(inMeal, (e) => e.kcal)),
      mealProteinG: whole(sum(inMeal, (e) => e.proteinG)),
      dayKcal: whole(dayKcal),
      dayProteinG: whole(dayProteinG),
      kcalTarget: whole(read.kcalTarget),
      proteinTargetG: whole(read.proteinTargetG),
      kcalLeft: whole(read.kcalTarget - dayKcal),
      proteinToGoG: whole(Math.max(0, read.proteinTargetG - dayProteinG)),
    };
  }

  private moves(day: CalendarDate, meal: Meal): unknown {
    const read = this.dayOf(day);
    if (read === undefined) return { error: 'The day is not read yet.' };
    const record = recordOnOf(read.input.history)(day);
    const found = mealMovesOf({
      meal,
      mealEntries: read.entries.filter((e) => e.meal === meal),
      dayEntries: read.entries,
      dailyKcalTarget: read.kcalTarget,
      dailyProteinTargetG: read.proteinTargetG,
      goal: record?.mode ?? 'fatLoss',
      history: read.input.entries,
      catalog: read.input.catalog,
      safeguards: read.input.safeguards,
      cautions: read.input.safeguards.cautions,
      snoozed: read.input.snoozed,
    });
    return {
      drag: found.outlier === undefined ? undefined : { name: found.outlier.name, kcal: whole(found.outlier.kcal), proteinG: whole(found.outlier.proteinG) },
      moves: found.moves.map((m) => mealMoveFigures(m).figures),
      best: found.best === undefined ? undefined : mealMoveFigures(found.best).figures,
    };
  }

  private myFoodsAt(day: CalendarDate, meal: Meal): unknown {
    const input = this.reads.foodInput();
    if (input === undefined) return { error: 'The foods are not read yet.' };
    const since = day.addDays(-FoodSignalRule.historyDays);
    const byKey = new Map<string, FoodEntry[]>();
    for (const e of input.entries) {
      if (e.meal !== meal || e.date.isBefore(since) || e.date.isAfter(day)) continue;
      const list = byKey.get(foodKeyOf(e));
      if (list === undefined) byKey.set(foodKeyOf(e), [e]);
      else list.push(e);
    }
    const median = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)] ?? 0;
    };
    const foods = [...byKey.values()]
      .map((entries) => ({
        name: entries[0]!.name.trim(),
        daysLogged: new Set(entries.map((e) => e.date.epochDay)).size,
        kcal: whole(median(entries.map((e) => e.kcal))),
        proteinG: whole(median(entries.map((e) => e.proteinG))),
        carbsG: whole(median(entries.map((e) => e.carbsG))),
        fatG: whole(median(entries.map((e) => e.fatG))),
      }))
      .sort((a, b) => b.daysLogged - a.daysLogged || a.name.localeCompare(b.name))
      .slice(0, 25);
    return { meal, foods };
  }

  private todayMeals(day: CalendarDate): unknown {
    const read = this.dayOf(day);
    if (read === undefined) return { error: 'The day is not read yet.' };
    const sum = (entries: readonly FoodEntry[], of: (e: FoodEntry) => number) => entries.reduce((s, e) => s + of(e), 0);
    const meals = Meal.values
      .map((meal) => ({ meal, foods: read.entries.filter((e) => e.meal === meal) }))
      .filter(({ foods }) => foods.length > 0)
      .map(({ meal, foods }) => ({ meal, kcal: whole(sum(foods, (e) => e.kcal)), proteinG: whole(sum(foods, (e) => e.proteinG)), foods: foods.map(foodOf) }));
    return {
      meals,
      dayKcal: whole(sum(read.entries, (e) => e.kcal)),
      dayProteinG: whole(sum(read.entries, (e) => e.proteinG)),
      kcalTarget: whole(read.kcalTarget),
      proteinTargetG: whole(read.proteinTargetG),
    };
  }

  private week(): unknown {
    const brief = this.reads.brief();
    if (brief === undefined) return { error: 'The week is not read yet.' };
    return {
      loggedDays: brief.sevenDay.loggedDays,
      calorieAdherenceDays: brief.sevenDay.calorieAdherenceDays,
      proteinFloorHitDays: brief.sevenDay.proteinFloorHitDays,
      averageKcal: whole(brief.sevenDay.averageKcal),
      averageProteinG: whole(brief.sevenDay.averageProteinG),
      weighIns: brief.sevenDay.weighIns,
    };
  }

  private training(): unknown {
    const t = this.reads.brief()?.training;
    if (t === undefined) return { held: false };
    return {
      held: true,
      liftingSessionsThisWeek: t.sessionsThisWeek,
      liftingSessionsSet: t.sessionsTarget,
      daysSinceLastLift: t.daysSinceSession,
      cardioHeld: t.cardioHeld,
      watchConnected: t.wearableInUse,
      cardioMinutesThisWeek: t.cardioMinutes,
      cardioMinutesFloor: t.cardioFloorMinutes,
      stepsPerDay: t.stepsPerDay,
      stepsFloor: t.stepsFloor,
    };
  }

  private async searchCatalog(input: unknown): Promise<unknown> {
    const catalog = this.reads.catalog();
    if (catalog === undefined) return { foods: [], note: 'No food database is installed.' };
    const args = asRecord(input);
    const query = asString(args.query) ?? '';
    const group = FoodGroup.fromName(asString(args.group));
    const maxKcal = asNumber(args.maxKcal);
    const minShare = asNumber(args.minProteinPercent);
    const hits = await catalog.search(query, { limit: 25, group });
    const foods: unknown[] = [];
    for (const hit of hits) {
      const food = hit.food;
      if (!(food.kcal > 0)) continue;
      // Per 100 g, scaled to the first serving when the pack lists one; a food stated per 100 mL only through its density.
      let grams: number | undefined;
      if (food.basis === 'per100g') grams = hit.firstServing?.grams ?? (await catalog.servingsOf(food))[0]?.grams ?? 100;
      else if (food.densityGPerMl !== undefined && food.densityGPerMl > 0) grams = (hit.firstServing?.milliliters ?? 100) * food.densityGPerMl;
      if (grams === undefined || !(grams > 0)) continue;
      const scale = grams / 100;
      const kcal = food.kcal * scale;
      const proteinG = food.proteinG * scale;
      if (maxKcal !== undefined && kcal > maxKcal) continue;
      if (minShare !== undefined && (proteinG * 4 * 100) / kcal < minShare) continue;
      foods.push({
        name: food.name,
        group: food.group,
        servingGrams: whole(grams),
        kcal: whole(kcal),
        proteinG: whole(proteinG),
        carbsG: whole(food.carbsG * scale),
        fatG: whole(food.fatG * scale),
      });
      if (foods.length >= 10) break;
    }
    return { foods };
  }

  private priceMove(day: CalendarDate, input: unknown): unknown {
    const read = this.dayOf(day);
    if (read === undefined) return { error: 'The day is not read yet.' };
    const args = asRecord(input);
    const kind = asString(args.kind);
    const foodName = asString(args.food);
    if (foodName === undefined) return { error: 'Name the logged food the move is about.' };
    const entry = read.entries.find((e) => foodKeyOf(e) === foodName.toLowerCase());
    if (entry === undefined) return { error: `No food called ${foodName} is logged today.` };
    const limits = foodLimitsOf(read.input.safeguards);
    const sum = (entries: readonly FoodEntry[], of: (e: FoodEntry) => number) => entries.reduce((s, e) => s + of(e), 0);
    const inMeal = read.entries.filter((e) => e.meal === entry.meal);
    const mealKcal = sum(inMeal, (e) => e.kcal);
    const mealProteinG = sum(inMeal, (e) => e.proteinG);
    const dayKcal = sum(read.entries, (e) => e.kcal);
    const dayProteinG = sum(read.entries, (e) => e.proteinG);
    const other = asRecord(args.other);
    const otherKcal = asNumber(other.kcal);
    const otherProteinG = asNumber(other.proteinG);
    let deltaKcal: number;
    let deltaProteinG: number;
    let allowed = true;
    let reason: string | undefined;
    switch (kind) {
      case 'cutPortion': {
        const keep = Math.min(1, Math.max(0, asNumber(args.keepShare) ?? 0.5));
        deltaKcal = -entry.kcal * (1 - keep);
        deltaProteinG = -entry.proteinG * (1 - keep);
        if (limits.noLowering || limits.underEating) {
          allowed = false;
          reason = 'The person’s safeguards allow no cut in what they eat.';
        }
        break;
      }
      case 'addProtein': {
        if (otherKcal === undefined || otherProteinG === undefined) return { error: 'Give the food to add, with its calories and protein.' };
        deltaKcal = otherKcal;
        deltaProteinG = otherProteinG;
        if (limits.noMoreProtein) {
          allowed = false;
          reason = 'With kidney disease protein is a cap: nothing is added for protein.';
        }
        break;
      }
      case 'swapSameGroup': {
        if (otherKcal === undefined || otherProteinG === undefined) return { error: 'Give the food to put in its place, with its calories and protein.' };
        deltaKcal = otherKcal - entry.kcal;
        deltaProteinG = otherProteinG - entry.proteinG;
        if (limits.noLowering && deltaKcal < 0) {
          allowed = false;
          reason = 'The person’s safeguards allow no swap for fewer calories.';
        }
        if (limits.noMoreProtein && deltaProteinG >= 8) {
          allowed = false;
          reason = 'With kidney disease protein is a cap: no swap for more of it.';
        }
        break;
      }
      default:
        return { error: 'kind is cutPortion, addProtein or swapSameGroup.' };
    }
    const mealAfterKcal = mealKcal + deltaKcal;
    const mealAfterProteinG = mealProteinG + deltaProteinG;
    const kcalLeftAfter = read.kcalTarget - (dayKcal + deltaKcal);
    const proteinToGoAfter = Math.max(0, read.proteinTargetG - (dayProteinG + deltaProteinG));
    return {
      allowed,
      ...(reason === undefined ? {} : { reason }),
      mealAfter: {
        kcal: whole(mealAfterKcal),
        proteinG: whole(mealAfterProteinG),
        proteinPercent: whole(mealAfterKcal > 0 ? (mealAfterProteinG * 4 * 100) / mealAfterKcal : 0),
      },
      dayAfter: { kcalLeft: whole(kcalLeftAfter), proteinToGoG: whole(proteinToGoAfter), fits: proteinToGoAfter * 4 <= kcalLeftAfter },
    };
  }
}
