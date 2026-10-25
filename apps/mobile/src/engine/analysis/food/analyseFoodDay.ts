import type { CalendarDate } from '../../../domain/CalendarDate';
import { FiberDay } from '../../../domain/food/fiber/FiberDay';
import { fiberGuideG } from '../../../domain/food/fiber/fiberGuideG';
import { SodiumDay } from '../../../domain/food/micros/SodiumDay';
import type { FoodEntry } from '../../../domain/FoodEntry';
import { CalorieBand } from '../../CalorieBand';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { CoachAdvice } from '../CoachAdvice';
import { CoachAdviceRule } from '../CoachAdviceRule';
import type { CoachCause } from '../CoachCause';
import type { CoachFinding } from '../CoachFinding';
import type { CoachFindingKind } from '../CoachFindingKind';
import type { CoachFood } from '../CoachFood';
import type { CoachTrade } from '../CoachTrade';
import { findTrade } from '../findTrade';
import { swapFor } from '../swap/swapFor';
import { adviceFoodOf } from './adviceFoodOf';
import type { DayAdviceContext } from './DayAdviceContext';
import { dayAdviceOf } from './dayAdviceOf';
import { dayUnitsOf } from './dayUnitsOf';
import type { FoodAnalysisInput } from './FoodAnalysisInput';
import { foodFindingAllowed } from './foodFindingAllowed';
import { foodGroupOf } from './foodGroupOf';
import { foodLimitsOf } from './foodLimitsOf';
import { FoodSignalId } from './FoodSignalId';
import { FoodSignalRule } from './FoodSignalRule';
import { foodsThatFit } from './foodsThatFit';
import { mealBreakdownOf } from './mealBreakdownOf';
import { recordOnOf } from './recordOnOf';
import { saucedOrFried } from './saucedOrFried';
import { topContributors } from './topContributors';

const R = FoodSignalRule;
const sum = (values: readonly number[]) => values.reduce((s, v) => s + v, 0);

interface DayFix {
  readonly signal: FoodSignalId;
  readonly direction: TrendDirection;
  readonly figures: Record<string, number>;
  readonly amountOf: ((e: FoodEntry) => number | undefined) | undefined;
}

/**
 * MM-612's 1d: today as logged so far, from the first entry, read against
 * today's own targets. Not a trend: no state, nothing written to the
 * announcement log, and no other day is read, mentioned or moved onto
 * (the non-goal "No automatic compensation"), except the person's own
 * foods of the last 56 days as the trade's Y and the foods that fit.
 *
 * - **Single-day margins:** fat over its target by 25% and 15 g, said only
 *   when it displaces protein or calories are over the band; protein per
 *   100 kcal under 85% of what the targets need, on 400 kcal or more;
 *   calories over the band on fat loss or recomp; sodium over a limit set.
 *   Each names its top foods (N11 over today) and carries a trade (MM-607).
 * - **Holding up:** protein at the minimum, calories within the band (never
 *   under it, MM-92), fiber at the guide.
 * - **What is left:** calories and protein against today's targets, and up
 *   to two foods the person logs that fit (`foodsThatFit`).
 * - **A Refeed or a Day off** (MM-611) shows its totals and what is left,
 *   and nothing else; so does a day with nothing logged yet, what is left
 *   being the whole of today's targets.
 * - **Ids** are the day's own (`day:<epochDay>:<signal>:<kind>`): a
 *   dismissal lasts the day, and never hides another day's line.
 * - **Safeguards** (`foodFindingAllowed`): under 18, paused or bariatric
 *   surgery, nothing; an eating-disorder history, protein only and no food
 *   named; the under-eating finding and the rest as on a span.
 *
 * **Orders (MM-617).** Every fix ends in at least one (`dayAdviceOf`), after
 * the safeguards (`adviceAllowed`); a fix left with none is not said. On a
 * day over the band, the meal that gave the most calories is taken apart
 * (`mealBreakdownOf`): its worst food is skipped, with what the day would
 * be without it, and the calorie line carries it as its `cause`.
 * - **Fiber** short of the guide by 5 g or more is a fix by the evening
 *   (`nowMinute` at 6 pm or later, or dinner logged), with two cups of
 *   vegetables.
 * - **Sodium** names the foods giving 10% of it or more.
 * - **What is left** carries the rest of today's limit on a day over target,
 *   or the protein left.
 * - **The closing line** (`close`, signal `backToPlan`) on any day over
 *   target: back to the target tomorrow, without making up. It carries the
 *   calories over and the meal that did it (the headline's verdict) where
 *   a calorie line may be said.
 * - On a day over the band the calorie line comes first among the fixes.
 */
export function analyseFoodDay(
  input: FoodAnalysisInput,
  today: CalendarDate,
  {
    nowMinute,
  }: {
    /** Minutes after midnight now, for the evening's fiber line; without it, only a logged dinner makes it the evening. */
    nowMinute?: number | undefined;
  } = {},
): CoachFinding[] {
  const limits = foodLimitsOf(input.safeguards);
  if (limits.nothing || limits.minorOrPaused) return [];
  const record = recordOnOf(input.history)(today);
  const entries = input.entries.filter((e) => e.date === today);
  if (record === undefined) return [];
  const targets = record.targets;
  const goal = record.mode;
  const kcalTarget = targets.kcal * (input.plannedShare?.(today) ?? 1);
  const kcal = sum(entries.map((e) => e.kcal));
  const proteinG = sum(entries.map((e) => e.proteinG));
  const fatG = sum(entries.map((e) => e.fatG));
  const carbsG = sum(entries.map((e) => e.carbsG));
  const dayKind = input.markedDays.get(today.epochDay) ?? 'none';

  const make = (
    signal: string,
    kind: CoachFindingKind,
    figures: Readonly<Record<string, number>>,
    {
      foods = [],
      trade,
      direction,
      advice,
      cause,
    }: {
      foods?: readonly CoachFood[];
      trade?: CoachTrade | undefined;
      direction?: TrendDirection | undefined;
      advice?: readonly CoachAdvice[] | undefined;
      cause?: CoachCause | undefined;
    } = {},
  ): CoachFinding => ({
    // Today's own: a dismissal lasts the day, and another day's line of the same signal is another finding.
    id: `day:${today.epochDay}:${signal}:${kind}`,
    signal,
    kind,
    span: 1,
    from: today,
    to: today,
    // What is left today and the closing line are coaching; a fix or a strength has its signal's own priority (MM-141).
    priority: kind === 'left' || kind === 'close' ? 'coaching' : FoodSignalId.priority(signal as FoodSignalId, direction),
    figures,
    foods,
    trade,
    trend: undefined,
    ...(advice === undefined || advice.length === 0 ? {} : { advice }),
    ...(cause === undefined ? {} : { cause }),
  });
  const allowed = (signal: string, kind: CoachFindingKind, direction: TrendDirection | undefined, figures: Readonly<Record<string, number>>) =>
    foodFindingAllowed({ limits, signal, kind, direction, goal, figures, day: true });

  // What is left.
  const kcalLeft = kcalTarget - kcal;
  const proteinLeftG = targets.proteinG - proteinG;
  const history = input.entries.filter((e) => !e.date.isBefore(today.addDays(-R.historyDays)) && e.date.isBefore(today));
  const fits = limits.proteinOnly || limits.noMoreProtein ? [] : foodsThatFit(history, proteinLeftG, kcalLeft);
  const left: CoachFinding[] =
    limits.proteinOnly && limits.noMoreProtein
      ? []
      : [
          make(
            'left',
            'left',
            {
              kcal,
              proteinG,
              fatG,
              carbsG,
              kcalTarget,
              proteinTargetG: targets.proteinG,
              kcalLeft,
              proteinLeftG,
              proteinOnly: limits.proteinOnly ? 1 : 0,
              proteinShown: limits.noMoreProtein ? 0 : 1,
              marked: dayKind === 'refeed' ? 1 : dayKind === 'dayOff' ? 2 : 0,
            },
            { foods: fits },
          ),
        ];
  // A marked day, or nothing logged yet today: what is left (at the full targets when nothing is logged), and nothing else.
  if (dayKind !== 'none' || entries.length === 0) return left;

  // Single-day margins.
  const required = (100 * targets.proteinG) / targets.kcal;
  const densityG = kcal > 0 ? (100 * proteinG) / kcal : 0;
  const band = new CalorieBand(kcalTarget);
  const over = kcal > band.highKcal;
  const gapKcal = (e: FoodEntry) => Math.max(0, e.kcal - (100 * e.proteinG) / required);
  const densityLow = kcal >= R.dayDensityMinimumKcal && densityG < R.dayDensityShareOfRequired * required;
  const candidates: DayFix[] = [];
  if (densityLow) {
    candidates.push({
      signal: 'proteinDensity',
      direction: 'down',
      figures: { kcal, proteinG, densityG, requiredG: required, targetG: targets.proteinG, targetKcal: targets.kcal },
      amountOf: gapKcal,
    });
  }
  // Under kidney disease protein is a cap, so fat is never said to have displaced it.
  const displaced = densityLow && !limits.noMoreProtein;
  if (fatG >= Math.max(R.dayFatMultiple * targets.fatG, targets.fatG + R.dayFatOverG) && (displaced || over)) {
    candidates.push({
      signal: 'fatAgainstTarget',
      direction: 'up',
      figures: { fatG, targetFatG: targets.fatG, kcal, proteinG, densityLow: displaced ? 1 : 0, over: over ? 1 : 0 },
      amountOf: (e) => e.fatG,
    });
  }
  if (over && (goal === 'fatLoss' || goal === 'recomp')) {
    candidates.push({
      signal: 'calories',
      direction: 'up',
      figures: { kcal, targetKcal: kcalTarget, highKcal: band.highKcal },
      amountOf: (e) => e.kcal,
    });
  }
  const sodium = input.sodium;
  if (sodium !== undefined && !today.isBefore(sodium.since)) {
    const known = SodiumDay.of(entries).knownMg;
    if (known > sodium.limitMg) {
      candidates.push({
        signal: 'sodium',
        direction: 'up',
        figures: { sodiumMg: known, limitMg: sodium.limitMg, sodiumMultiple: known / sodium.limitMg },
        amountOf: (e) => e.sodiumMg,
      });
    }
  }
  // Fiber short by the evening (MM-617): before it, the day's vegetables may still come.
  const dinnerLogged = entries.some((e) => e.meal === 'dinner');
  const fiberGuide = input.fiber === undefined ? undefined : fiberGuideG({ kcalTarget: targets.kcal, sex: input.fiber.sex });
  const fiberDay = FiberDay.of(entries);
  const evening = dinnerLogged || (nowMinute !== undefined && nowMinute >= CoachAdviceRule.eveningMinute);
  if (fiberGuide !== undefined && fiberDay.enough && evening && fiberGuide - fiberDay.totalG >= CoachAdviceRule.dayFiberShortG) {
    candidates.push({
      signal: 'fiber',
      direction: 'down',
      figures: { fiberG: fiberDay.totalG, guideG: fiberGuide, shortG: fiberGuide - fiberDay.totalG, averageG: fiberDay.totalG, countedDays: 1 },
      amountOf: undefined,
    });
  }

  // Safeguards first, then one per family: fat speaks for calories when both hold.
  const fixes: CoachFinding[] = [];
  const families = new Set<string>();
  const activeSignals = new Set<string>(candidates.map((c) => c.signal));
  for (const c of candidates.filter((x) => allowed(x.signal, 'fix', x.direction, x.figures))) {
    const family = FoodSignalId.family(c.signal);
    if (family !== undefined && families.has(family)) {
      const at = fixes.findIndex((f) => FoodSignalId.family(f.signal as FoodSignalId) === family);
      const top = fixes[at];
      if (top !== undefined) {
        fixes[at] = { ...top, figures: { ...top.figures, ...Object.fromEntries(Object.entries(c.figures).map(([k, v]) => [`${c.signal}.${k}`, v])) } };
      }
      continue;
    }
    if (family !== undefined) families.add(family);
    const foods =
      limits.proteinOnly || c.amountOf === undefined
        ? []
        : topContributors(entries, c.amountOf, {
            minimumDays: 1,
            minimumShare: c.signal === 'sodium' ? CoachAdviceRule.daySodiumFoodShare : R.dayContributorShare,
          });
    const motive = FoodSignalId.motive(c.signal);
    const trade =
      motive !== undefined && foods.length > 0 && !limits.proteinOnly && (c.signal !== 'calories' || goal === 'fatLoss')
        ? findTrade({
            motive,
            goal,
            spanEntries: entries,
            history: input.entries.filter((e) => !e.date.isBefore(today.addDays(1 - R.historyDays)) && !e.date.isAfter(today)),
            catalog: input.catalog,
            safeguards: input.safeguards,
            cautions: input.safeguards.cautions,
            activeSignals,
            calorieRoom: kcalLeft > 0,
            spanDays: 1,
            // No floor check on a day still being eaten: what is logged so far is nearly always under the floor,
            // and the day is judged against its target, which the floor already bounds.
            calorieFloorKcal: undefined,
            snoozed: input.snoozed,
          })
        : undefined;
    fixes.push(make(c.signal, 'fix', { ...c.figures, direction: c.direction === 'down' ? -1 : 1, calorieRoom: kcalLeft > 0 ? 1 : 0, tradeDays: 1 }, { foods, trade, direction: c.direction }));
  }

  // Holding up: never calories under the band.
  const holding: CoachFinding[] = [];
  const minimumG = targets.proteinMinimumG;
  if (minimumG !== undefined && proteinG >= minimumG) holding.push(make('proteinMinimum', 'holdingUp', { proteinG, minimumG }));
  if (band.contains(kcal)) holding.push(make('calories', 'holdingUp', { kcal, targetKcal: kcalTarget }));
  if (fiberGuide !== undefined && fiberDay.enough && fiberDay.totalG >= fiberGuide) {
    holding.push(make('fiber', 'holdingUp', { fiberG: fiberDay.totalG, guideG: fiberGuide }));
  }

  // The orders (MM-617): the meal breakdown on a day over the band, then each fix's, the calorie line's first.
  const overKcal = kcal - kcalTarget;
  const breakdown = over ? mealBreakdownOf(entries, required) : undefined;
  const units = dayUnitsOf(entries, breakdown?.key);
  const swapHistory = input.entries.filter((e) => !e.date.isBefore(today.addDays(1 - R.historyDays)) && !e.date.isAfter(today));
  const context: DayAdviceContext = {
    limits,
    units,
    breakdown,
    overKcal,
    requiredPer100Kcal: required,
    targetKcal: targets.kcal,
    kcalLeft,
    proteinLeftG,
    fits,
    sauced: entries.some((e) => saucedOrFried(e.name)),
    dinnerLogged,
    swap: (unit) =>
      swapFor({
        food: { ...unit.food, carbsG: unit.carbsG },
        group: unit.food.meal === true ? undefined : foodGroupOf(unit.food.key, entries, input.catalog),
        meal: unit.meal,
        goal,
        history: swapHistory,
        catalog: input.catalog,
        safeguards: input.safeguards,
        cautions: input.safeguards.cautions,
      }),
  };
  // What drove the day: the meal that gave the most calories, and its worst food, where a calorie line may be said.
  const calorieLines = allowed('calories', 'fix', 'up', {});
  const worst = breakdown?.worst[0];
  const cause: CoachCause | undefined =
    breakdown === undefined || !calorieLines
      ? undefined
      : {
          meal: breakdown.meal,
          mealName: breakdown.name,
          mealKcal: breakdown.kcal,
          mealFoods: breakdown.entries.length,
          food: worst === undefined ? undefined : adviceFoodOf(worst.name, [worst]),
        };
  const calorieFamily = (f: CoachFinding) => FoodSignalId.family(f.signal as FoodSignalId) === 'calories';
  const named = new Set<string>();
  const advised = new Map<CoachFinding, CoachFinding>();
  for (const f of [...fixes.filter(calorieFamily), ...fixes.filter((x) => !calorieFamily(x))]) {
    const advice = dayAdviceOf(f, context, named);
    if (calorieFamily(f)) for (const a of advice) if (a.food !== undefined && a.kind === 'skip') named.add(a.food.key);
    const figures = calorieFamily(f) && over ? { ...f.figures, overKcal, kcalTarget } : f.figures;
    advised.set(f, { ...f, figures, ...(advice.length === 0 ? {} : { advice }), ...(calorieFamily(f) && cause !== undefined ? { cause } : {}) });
  }
  // A fix the safeguards leave no order for is not said. On a day over the band the calorie line leads: it is the day's verdict.
  const ordered = (over ? [...fixes.filter(calorieFamily), ...fixes.filter((x) => !calorieFamily(x))] : fixes).flatMap((f) => {
    const a = advised.get(f);
    return a?.advice === undefined ? [] : [a];
  });
  const leftAdvised = left.map((f) => {
    const advice = dayAdviceOf(f, context);
    return advice.length === 0 ? f : { ...f, advice };
  });
  const closeAdvice = overKcal > 0 ? dayAdviceOf(make('backToPlan', 'close', {}), context) : [];
  const close =
    closeAdvice.length === 0
      ? []
      : [
          make(
            'backToPlan',
            'close',
            {
              kcal,
              targetKcal: kcalTarget,
              ...(calorieLines ? { overKcal, overBand: over ? 1 : 0 } : {}),
            },
            { advice: closeAdvice, cause: over ? cause : undefined },
          ),
        ];
  return [...ordered, ...holding.filter((h) => allowed(h.signal, 'holdingUp', undefined, h.figures)), ...leftAdvised, ...close];
}
