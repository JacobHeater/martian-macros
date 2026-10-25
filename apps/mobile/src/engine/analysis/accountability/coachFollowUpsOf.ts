import type { CalendarDate } from '../../../domain/CalendarDate';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';
import { medianOf } from '../../trends/medianOf';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import { adviceFoodOf } from '../food/adviceFoodOf';
import type { FoodDay } from '../food/FoodDay';
import { foodDaysOf } from '../food/foodDaysOf';
import { foodKeyOf } from '../food/foodKeyOf';
import { foodLimitsOf } from '../food/foodLimitsOf';
import { FoodSignalRule } from '../food/FoodSignalRule';
import { mealBreakdownOf } from '../food/mealBreakdownOf';
import type { CoachAdviceGiven } from './CoachAdviceGiven';
import type { CoachFollowUp } from './CoachFollowUp';
import { CoachFollowUpRule } from './CoachFollowUpRule';
import type { CoachFollowUpInput } from './CoachFollowUpInput';
import { entryIsOf } from './entryIsOf';
import { followUpAllowed } from './followUpAllowed';

const R = CoachFollowUpRule;

/** What a food came to on one day: its entries' sums. */
interface FoodOnDay {
  readonly kcal: number;
  readonly fatG: number;
  readonly proteinG: number;
  readonly sodiumMg: number | undefined;
  /** Matched as a meal logged as one under the key's name, not as a food of that name. */
  readonly meal: boolean;
}

/** The food `key` on each day it was eaten, by epoch day. */
function byDayOf(entries: readonly FoodEntry[], key: string): Map<number, FoodOnDay> {
  const days = new Map<number, FoodOnDay>();
  for (const e of entries) {
    if (!entryIsOf(e, key)) continue;
    const was = days.get(e.date.epochDay);
    const sodium = e.sodiumMg === undefined ? was?.sodiumMg : (was?.sodiumMg ?? 0) + e.sodiumMg;
    days.set(e.date.epochDay, {
      kcal: (was?.kcal ?? 0) + e.kcal,
      fatG: (was?.fatG ?? 0) + e.fatG,
      proteinG: (was?.proteinG ?? 0) + e.proteinG,
      sodiumMg: sodium,
      meal: (was?.meal ?? false) || foodKeyOf(e) !== key,
    });
  }
  return days;
}

/** A food as a follow-up names it, from its days. */
function foodOf(key: string, name: string, days: readonly FoodOnDay[], take: (values: readonly number[]) => number): CoachAdviceFood {
  const sodium = days.flatMap((d) => (d.sodiumMg === undefined ? [] : [d.sodiumMg]));
  return {
    key,
    name,
    kcal: take(days.map((d) => d.kcal)),
    fatG: take(days.map((d) => d.fatG)),
    proteinG: take(days.map((d) => d.proteinG)),
    sodiumMg: sodium.length === 0 ? undefined : take(sodium),
    ...(days.some((d) => d.meal) ? { meal: true } : {}),
  };
}

const sumOf = (values: readonly number[]) => values.reduce((s, v) => s + v, 0);

/**
 * The coach's accountability (MM-617): from its record of the advice it
 * showed and the food log, what it holds the person to today. Pure: the
 * record is read and written by the state (`CoachAnalysis`).
 *
 * - **Said before:** a food it said to skip or swap on day D, within the
 *   last 14 days, eaten again today. The latest order is followed up (a
 *   skip before a swap of the same day), with today's calories; D is said
 *   by its weekday within 6 days, else by its date.
 * - **Repeats:** days this calendar week (Monday first) over their target
 *   by 500 kcal or more, today among them, said from 2, with what drove
 *   them: the worst food of the day's biggest meal (`mealBreakdownOf`) when
 *   one food was it on 2 days or more, else that meal. Fat over its target
 *   (1d's margin, `FoodSignalRule.dayFatMultiple` and `dayFatOverG`) on 3 or
 *   more of the last 7 days, today among them; and protein under its
 *   minimum (else its target) on 3 or more of the 7 whole days before today.
 *   A Refeed or a Day off (MM-611) is never counted.
 * - **Advice taken:** a food it said to skip, eaten on 3 or more of the 14
 *   days before that advice and not since, on 3 whole days running or more,
 *   and not today so far. The advice is the first skip given on or after
 *   the last day it was eaten. Calories saved: its median calories a day
 *   over those days times the days it would have been eaten at its old
 *   rate, rounded to whole days (at least one). Said once per piece of
 *   advice: not when the record says it was said (`taken`) on an earlier
 *   day since the advice.
 *
 * Nothing on a day marked a Refeed or a Day off. The safeguards run last
 * (`followUpAllowed`).
 */
export function coachFollowUpsOf({ food, given, today }: CoachFollowUpInput): CoachFollowUp[] {
  const limits = foodLimitsOf(food.safeguards);
  if (limits.nothing) return [];
  if ((food.markedDays.get(today.epochDay) ?? 'none') !== 'none') return [];
  const recent = given.filter((g) => !g.on.isBefore(today.addDays(-R.saidBeforeDays)) && g.on.isBefore(today));
  return [...saidBefore(food.entries, recent, today), ...repeats(food, today), ...taken(food.entries, recent, given, today)].filter((f) =>
    followUpAllowed(f, limits),
  );
}

function saidBefore(entries: readonly FoodEntry[], recent: readonly CoachAdviceGiven[], today: CalendarDate): CoachFollowUp[] {
  const latest = new Map<string, CoachAdviceGiven>();
  for (const g of recent) {
    if (g.kind !== 'skip' && g.kind !== 'swap') continue;
    const was = latest.get(g.foodKey);
    if (was === undefined || g.on.isAfter(was.on) || (g.on === was.on && g.kind === 'skip' && was.kind !== 'skip')) latest.set(g.foodKey, g);
  }
  const todays = entries.filter((e) => e.date === today);
  const out: CoachFollowUp[] = [];
  for (const g of latest.values()) {
    const day = byDayOf(todays, g.foodKey).get(today.epochDay);
    if (day === undefined || !(day.kcal > 0)) continue;
    out.push({
      kind: 'saidBefore',
      food: foodOf(g.foodKey, g.foodName, [day], sumOf),
      order: g.kind === 'swap' ? 'swap' : 'skip',
      ...(g.replacementName === undefined ? {} : { replacementName: g.replacementName }),
      givenOn: g.on,
      byWeekday: g.on.daysUntil(today) <= R.weekdayWithinDays,
      givenKcal: g.kcal,
    });
  }
  return out.sort((a, b) => (b.food?.kcal ?? 0) - (a.food?.kcal ?? 0) || (a.food?.key ?? '').localeCompare(b.food?.key ?? ''));
}

function repeats(food: CoachFollowUpInput['food'], today: CalendarDate): CoachFollowUp[] {
  const monday = today.addDays(-((today.weekday + 6) % 7));
  const windowFrom = today.addDays(-R.repeatWindowDays);
  const days = foodDaysOf(food, monday.isBefore(windowFrom) ? monday : windowFrom, today);
  // A day's totals: its intake (paused days left out by the caller); today's, while not yet in the intake, from its entries.
  const totalsOf = (d: FoodDay): { kcal: number; fatG: number; proteinG: number } | undefined => {
    if (d.intake !== undefined) return d.intake;
    if (d.date !== today || d.entries.length === 0) return undefined;
    const sum = (of: (e: FoodEntry) => number) => d.entries.reduce((t, e) => t + of(e), 0);
    return { kcal: sum((e) => e.kcal), fatG: sum((e) => e.fatG), proteinG: sum((e) => e.proteinG) };
  };
  const counted = (d: FoodDay) => d.kind === 'none' && totalsOf(d) !== undefined && d.record !== undefined && d.kcalTarget !== undefined;
  const out: CoachFollowUp[] = [];

  // Over by 500 or more this calendar week, today among them.
  const over = days.filter(
    (d) => !d.date.isBefore(monday) && counted(d) && (totalsOf(d)?.kcal ?? 0) - (d.kcalTarget ?? 0) >= R.repeatOverKcal,
  );
  if (over.some((d) => d.date === today) && over.length >= R.repeatOverMinDays) {
    const worst = new Map<string, { name: string; days: number; kcal: number; entries: FoodEntry[] }>();
    const meals = new Map<Meal, number>();
    for (const d of over) {
      const targets = d.record?.targets;
      if (targets === undefined) continue;
      const b = mealBreakdownOf(d.entries, targets.kcal > 0 ? (100 * targets.proteinG) / targets.kcal : 0);
      if (b === undefined) continue;
      meals.set(b.meal, (meals.get(b.meal) ?? 0) + 1);
      const first = b.worst[0];
      if (first === undefined) continue;
      const key = foodKeyOf(first);
      const was = worst.get(key) ?? { name: first.name.trim(), days: 0, kcal: 0, entries: [] };
      worst.set(key, { name: was.name, days: was.days + 1, kcal: was.kcal + first.kcal, entries: [...was.entries, first] });
    }
    const [key, top] = [...worst].sort(([ka, a], [kb, b]) => b.days - a.days || b.kcal - a.kcal || ka.localeCompare(kb))[0] ?? [];
    const [meal, mealDays] = [...meals].sort(([ma, a], [mb, b]) => b - a || ma.localeCompare(mb))[0] ?? [];
    const driver =
      key !== undefined && top !== undefined && top.days >= R.repeatDriverMinDays
        ? { food: adviceFoodOf(top.name, top.entries), drivenDays: top.days }
        : meal !== undefined && mealDays !== undefined && mealDays >= R.repeatDriverMinDays
          ? { meal, drivenDays: mealDays }
          : {};
    out.push({ kind: 'repeatOver', days: over.length, overByKcal: R.repeatOverKcal, ...driver });
  }

  // Fat over its target on 3 or more of the last 7 days, today among them.
  const last7 = days.filter((d) => d.date.isAfter(today.addDays(-R.repeatWindowDays)) && counted(d));
  const fatOver = last7.filter((d) => {
    const target = d.record?.targets.fatG ?? 0;
    return target > 0 && (totalsOf(d)?.fatG ?? 0) >= Math.max(FoodSignalRule.dayFatMultiple * target, target + FoodSignalRule.dayFatOverG);
  });
  if (fatOver.some((d) => d.date === today) && fatOver.length >= R.repeatMinDays) {
    out.push({ kind: 'repeatFat', days: fatOver.length, ofDays: R.repeatWindowDays });
  }

  // Protein short on 3 or more of the 7 whole days before today.
  const short = days.filter((d) => {
    if (!d.date.isBefore(today) || d.date.isBefore(windowFrom) || !counted(d) || !d.whole) return false;
    const targets = d.record?.targets;
    if (targets === undefined) return false;
    return (totalsOf(d)?.proteinG ?? 0) < (targets.proteinMinimumG ?? targets.proteinG);
  });
  if (short.length >= R.repeatMinDays) out.push({ kind: 'repeatProteinShort', days: short.length, ofDays: R.repeatWindowDays });
  return out;
}

function taken(
  entries: readonly FoodEntry[],
  recent: readonly CoachAdviceGiven[],
  given: readonly CoachAdviceGiven[],
  today: CalendarDate,
): CoachFollowUp[] {
  const out: CoachFollowUp[] = [];
  const keys = [...new Set(recent.filter((g) => g.kind === 'skip').map((g) => g.foodKey))].sort();
  for (const key of keys) {
    const eaten = byDayOf(entries, key);
    if (eaten.has(today.epochDay)) continue;
    let last: number | undefined;
    for (const day of eaten.keys()) if (day < today.epochDay && (last === undefined || day > last)) last = day;
    // The piece of advice: the first skip given on or after the last day it was eaten.
    const advice = recent
      .filter((g) => g.kind === 'skip' && g.foodKey === key && (last === undefined || g.on.epochDay >= last))
      .sort((a, b) => a.on.compareTo(b.on))[0];
    if (advice === undefined) continue;
    const running = today.epochDay - 1 - advice.on.epochDay;
    if (running < R.takenSinceMinDays) continue;
    const said = given.some((g) => g.kind === 'taken' && g.foodKey === key && !g.on.isBefore(advice.on) && g.on.isBefore(today));
    if (said) continue;
    const before = [...eaten]
      .filter(([day]) => day >= advice.on.epochDay - R.takenBeforeDays && day < advice.on.epochDay)
      .map(([, d]) => d);
    if (before.length < R.takenBeforeMinDays) continue;
    const usual = foodOf(key, advice.foodName, before, medianOf);
    const atOldRate = Math.max(1, Math.round((before.length / R.takenBeforeDays) * running));
    out.push({
      kind: 'adviceTaken',
      food: usual,
      order: 'skip',
      givenOn: advice.on,
      days: running,
      beforeDays: before.length,
      ofDays: R.takenBeforeDays,
      savedKcal: Math.round(usual.kcal * atOldRate),
    });
  }
  return out;
}
