import type { CalendarDate } from '../../domain/CalendarDate';
import type { FoodEntry } from '../../domain/FoodEntry';
import { CalorieBand } from '../CalorieBand';
import type { ExecutiveBrief } from './ExecutiveBrief';
import type { TrainingBrief } from './TrainingBrief';
import { countsAsFood } from './food/countsAsFood';
import type { FoodAnalysisInput } from './food/FoodAnalysisInput';
import { foodLimitsOf } from './food/foodLimitsOf';
import { FoodSignalRule } from './food/FoodSignalRule';
import { mealBreakdownOf } from './food/mealBreakdownOf';
import { recordOnOf } from './food/recordOnOf';
import type { Meal } from '../../domain/Meal';
import { mealMovesOf } from './moves/mealMovesOf';
import { runwayIsTight } from './runwayIsTight';

const sum = (values: readonly number[]) => values.reduce((s, v) => s + v, 0);

/**
 * Deterministically computes the `ExecutiveBrief` for `today` and the 7-day
 * window ending at `today` (MM-663).
 *
 * Enforces the mathematical invariant `proteinRemainingG * 4 <= kcalRemaining`:
 * whenever remaining protein requires more calories than remain today,
 * `runwayState` transitions to `'proteinUnrecoverable'` rather than issuing an
 * impossible macro directive.
 */
export function executiveBriefOf(
  input: FoodAnalysisInput,
  today: CalendarDate,
  options: { readonly weighIns7d?: number | undefined; readonly training?: TrainingBrief | undefined } = {},
): ExecutiveBrief | undefined {
  const limits = foodLimitsOf(input.safeguards);
  if (limits.nothing || limits.minorOrPaused) return undefined;
  const recordOn = recordOnOf(input.history);
  const record = recordOn(today);
  if (record === undefined) return undefined;

  const targets = record.targets;
  const kcalTarget = targets.kcal * (input.plannedShare?.(today) ?? 1);
  const proteinTargetG = targets.proteinG;
  const proteinMinimumG = targets.proteinMinimumG ?? targets.proteinG;

  const todayEntries = input.entries.filter((e) => e.date === today);
  const kcalLogged = sum(todayEntries.map((e) => e.kcal));
  const proteinLoggedG = sum(todayEntries.map((e) => e.proteinG));
  const kcalRemaining = kcalTarget - kcalLogged;
  const proteinRemainingG = Math.max(0, proteinTargetG - proteinLoggedG);
  const minKcalForProtein = proteinRemainingG * 4;
  const requiredProteinDensity = kcalRemaining > 0 ? minKcalForProtein / kcalRemaining : proteinRemainingG > 0 ? 1 : 0;
  const targetProteinDensity = kcalTarget > 0 ? (proteinTargetG * 4) / kcalTarget : 0;
  // The latest main meal with food today (MM-711), so the brief can say which meals carry the protein.
  const mains: readonly Meal[] = ['breakfast', 'lunch', 'dinner'];
  const lastMeal = [...mains].reverse().find((meal) => todayEntries.some((e) => e.meal === meal));

  const band = new CalorieBand(kcalTarget);
  const overBand = kcalLogged > band.highKcal;

  let runwayState: ExecutiveBrief['runwayState'];
  if (todayEntries.length === 0) {
    runwayState = 'nothingLogged';
  } else if (limits.proteinOnly) {
    runwayState = proteinRemainingG <= 0 ? 'targetsLocked' : 'onTrack';
  } else if (kcalRemaining < 0 || overBand) {
    runwayState = 'overBudget';
  } else if (proteinRemainingG > 0 && (minKcalForProtein > kcalRemaining || requiredProteinDensity > 0.85)) {
    runwayState = 'proteinUnrecoverable';
  } else if (proteinRemainingG <= 0) {
    runwayState = 'targetsLocked';
  } else if (runwayIsTight(requiredProteinDensity, targetProteinDensity)) {
    // Tight is lean protein only from here (MM-711), never a few points over the day's own density.
    runwayState = 'tightRunway';
  } else {
    runwayState = 'onTrack';
  }

  let primaryDriver: ExecutiveBrief['primaryDriver'];
  if (!limits.proteinOnly && todayEntries.length > 0 && (runwayState === 'overBudget' || runwayState === 'proteinUnrecoverable' || runwayState === 'tightRunway')) {
    const requiredPer100 = kcalTarget > 0 ? (100 * proteinTargetG) / kcalTarget : 0;
    const breakdown = mealBreakdownOf(todayEntries, requiredPer100);
    const countable = todayEntries.filter(countsAsFood);
    const worstEntry: FoodEntry | undefined =
      breakdown?.worst[0] ??
      [...countable].sort(
        (a, b) => b.kcal - (requiredPer100 > 0 ? (100 * b.proteinG) / requiredPer100 : 0) - (a.kcal - (requiredPer100 > 0 ? (100 * a.proteinG) / requiredPer100 : 0)),
      )[0];

    if (worstEntry !== undefined && worstEntry.kcal >= 150) {
      const history56 = input.entries.filter((e) => !e.date.isBefore(today.addDays(-FoodSignalRule.historyDays)) && e.date.isBefore(today));
      const meal = breakdown?.meal ?? worstEntry.meal;
      // The meal's own fix for next time (MM-684): the first of its moves that is not today's order.
      const move = mealMovesOf({
        meal,
        mealEntries: todayEntries.filter((e) => e.meal === meal),
        dayEntries: todayEntries,
        dailyKcalTarget: kcalTarget,
        dailyProteinTargetG: proteinTargetG,
        goal: record.mode,
        history: [...history56, worstEntry],
        catalog: input.catalog,
        safeguards: input.safeguards,
        cautions: input.safeguards.cautions,
        snoozed: input.snoozed,
      }).moves.find((m) => m.kind !== 'nextMeal');
      const overKcal = Math.max(0, kcalLogged - kcalTarget);
      primaryDriver = {
        meal,
        mealName: breakdown?.name ?? worstEntry.loggedMeal?.name.trim(),
        foodName: worstEntry.name.trim(),
        kcal: worstEntry.kcal,
        proteinG: worstEntry.proteinG,
        fatG: worstEntry.fatG,
        ...(overKcal > 0 ? { withoutKcalOver: overKcal - worstEntry.kcal } : {}),
        ...(move === undefined ? {} : { move }),
      };
    }
  }

  // 7-day window ending today (inclusive of logged days).
  const windowStart = today.addDays(-6);
  const byDay = new Map<number, FoodEntry[]>();
  for (const entry of input.entries) {
    if (entry.date.isBefore(windowStart) || entry.date.isAfter(today)) continue;
    const list = byDay.get(entry.date.epochDay) ?? [];
    list.push(entry);
    byDay.set(entry.date.epochDay, list);
  }
  let loggedDays = 0;
  let calorieAdherenceDays = 0;
  let proteinFloorHitDays = 0;
  let totalKcal = 0;
  let totalProteinG = 0;
  for (const [epochDay, entries] of byDay.entries()) {
    if (entries.length === 0) continue;
    loggedDays++;
    const dayDate = entries[0]!.date;
    const dayRecord = recordOn(dayDate) ?? record;
    const dayTargetKcal = dayRecord.targets.kcal * (input.plannedShare?.(dayDate) ?? 1);
    const dayBand = new CalorieBand(dayTargetKcal);
    const dayMinProtein = dayRecord.targets.proteinMinimumG ?? dayRecord.targets.proteinG;
    const dayKcal = sum(entries.map((e) => e.kcal));
    const dayProtein = sum(entries.map((e) => e.proteinG));
    totalKcal += dayKcal;
    totalProteinG += dayProtein;
    const marked = input.markedDays.get(epochDay) ?? 'none';
    if (marked !== 'none' || (dayKcal >= dayBand.lowKcal && dayKcal <= dayBand.highKcal)) {
      calorieAdherenceDays++;
    }
    if (dayProtein >= dayMinProtein) {
      proteinFloorHitDays++;
    }
  }

  const proteinUnrecoverable = runwayState === 'proteinUnrecoverable';
  // Nothing of training on the protected path (MM-681): the brief then speaks of protein alone.
  const training = limits.proteinOnly ? undefined : options.training;
  const briefHash = [
    today.toString(),
    limits.proteinOnly ? 'protected' : 'full',
    runwayState,
    lastMeal ?? '',
    Math.round(kcalTarget),
    Math.round(kcalLogged),
    Math.round(proteinTargetG),
    Math.round(proteinLoggedG),
    primaryDriver?.foodName ?? '',
    primaryDriver?.move?.kind ?? '',
    loggedDays,
    calorieAdherenceDays,
    proteinFloorHitDays,
    options.weighIns7d ?? 0,
    // The training figures too (MM-681), so a session logged or a walk read is narrated anew.
    ...(training === undefined
      ? []
      : [training.sessionsThisWeek, training.sessionsTarget, training.daysSinceSession ?? -1, training.cardioMinutes, training.stepsPerDay ?? -1, training.wearableInUse ? 1 : 0]),
  ].join(':');

  return {
    date: today,
    protectedPath: limits.proteinOnly,
    runwayState,
    kcalTarget,
    kcalLogged,
    kcalRemaining,
    proteinTargetG,
    proteinMinimumG,
    proteinLoggedG,
    proteinRemainingG,
    requiredProteinDensity,
    proteinUnrecoverable,
    ...(lastMeal === undefined ? {} : { lastMeal }),
    briefHash,
    ...(primaryDriver === undefined ? {} : { primaryDriver }),
    sevenDay: {
      loggedDays,
      calorieAdherenceDays,
      proteinFloorHitDays,
      averageKcal: loggedDays > 0 ? totalKcal / loggedDays : 0,
      averageProteinG: loggedDays > 0 ? totalProteinG / loggedDays : 0,
      weighIns: options.weighIns7d ?? 0,
    },
    ...(training === undefined ? {} : { training }),
  };
}
