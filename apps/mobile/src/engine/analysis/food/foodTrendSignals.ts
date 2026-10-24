import { FiberDay } from '../../../domain/food/fiber/FiberDay';
import { fiberGuideG } from '../../../domain/food/fiber/fiberGuideG';
import { SodiumDay } from '../../../domain/food/micros/SodiumDay';
import type { TrendSignal } from '../../trends/TrendSignal';
import type { FoodDay } from './FoodDay';
import type { FoodSignalId } from './FoodSignalId';
import { FoodSignalRule } from './FoodSignalRule';
import type { FoodSpan } from './FoodSpan';
import { foodTrendSignal } from './foodTrendSignal';

const mainMeals = ['breakfast', 'lunch', 'dinner'] as const;

/** Grams of protein per 100 kcal that a day's targets need: `req = 100 × T.proteinG / T.kcal` (MM-606). */
const requiredOf = (d: FoodDay) => (d.record === undefined ? undefined : (100 * d.record.targets.proteinG) / d.record.targets.kcal);

const densityOf = (d: FoodDay) => (d.intake === undefined || !(d.intake.kcal > 0) ? undefined : (100 * d.intake.proteinG) / d.intake.kcal);

/**
 * MM-606's signal definitions for MM-605's trend engine: N1–N9 and N12–N16,
 * each its series, target, δ (uncertain where the ticket says so, calibrated
 * by the null simulation), σ floor, family and good direction. Whether a
 * finding is said, and how, is `analyseFoodSpan`'s: the gates, the level
 * rules and the safeguards.
 */
export const foodTrendSignals: Readonly<Record<FoodSignalId, TrendSignal<FoodSpan>>> = {
  // N1: protein against the day's minimum.
  proteinMinimum: foodTrendSignal({
    id: 'proteinMinimum',
    value: (d) => d.intake?.proteinG,
    target: (d) => d.record?.targets.proteinMinimumG,
    unit: 'g',
    delta: 5,
    sigmaFloor: 5,
    roundTo: 1,
    goodDirection: 'up',
  }),
  // N2: protein against the day's target.
  proteinTarget: foodTrendSignal({
    id: 'proteinTarget',
    value: (d) => d.intake?.proteinG,
    target: (d) => d.record?.targets.proteinG,
    unit: 'g',
    delta: 10,
    sigmaFloor: 5,
    roundTo: 1,
    goodDirection: 'up',
  }),
  // N3: the main meal with the least protein; read per meal by its level rule.
  proteinByMeal: foodTrendSignal({
    id: 'proteinByMeal',
    value: (d) =>
      d.entries.length === 0
        ? undefined
        : Math.min(...mainMeals.map((m) => d.entries.filter((e) => e.meal === m).reduce((s, e) => s + e.proteinG, 0))),
    target: () => FoodSignalRule.mealAlmostNoneG,
    unit: 'g',
    delta: 5,
    sigmaFloor: 5,
    roundTo: 1,
    goodDirection: 'up',
    detectors: [],
  }),
  // N4: protein per 100 kcal against what the day's targets need.
  proteinDensity: foodTrendSignal({
    id: 'proteinDensity',
    value: densityOf,
    target: requiredOf,
    unit: 'g per 100 kcal',
    delta: 1,
    sigmaFloor: 0.5,
    roundTo: 0.1,
    goodDirection: 'up',
  }),
  // N5: fat against the day's target. Its low side is read against the fat minimum by the level rule.
  fatAgainstTarget: foodTrendSignal({
    id: 'fatAgainstTarget',
    value: (d) => d.intake?.fatG,
    target: (d) => d.record?.targets.fatG,
    unit: 'g',
    delta: 15,
    sigmaFloor: 5,
    roundTo: 1,
    goodDirection: undefined,
  }),
  // N6: fat's share of calories against the share the day's targets plan, in points.
  fatShare: foodTrendSignal({
    id: 'fatShare',
    value: (d) => (d.intake === undefined || !(d.intake.kcal > 0) ? undefined : (900 * d.intake.fatG) / d.intake.kcal),
    target: (d) => (d.record === undefined ? undefined : (900 * d.record.targets.fatG) / d.record.targets.kcal),
    unit: 'points',
    delta: 10,
    sigmaFloor: 2,
    roundTo: 1,
    goodDirection: undefined,
  }),
  // N7: carbohydrate against the floor a chosen balance keeps.
  carbohydrate: foodTrendSignal({
    id: 'carbohydrate',
    value: (d) => d.intake?.carbsG,
    target: (_, span) =>
      span.input.balance !== undefined && !span.input.balance.carbFloorOff ? FoodSignalRule.carbFloorG : undefined,
    unit: 'g',
    delta: 15,
    sigmaFloor: 10,
    roundTo: 1,
    goodDirection: 'up',
  }),
  // N8: protein's share of calories against its planned share; the split is read whole by the level rule.
  macroSplit: foodTrendSignal({
    id: 'macroSplit',
    value: (d) => (d.intake === undefined || !(d.intake.kcal > 0) ? undefined : (400 * d.intake.proteinG) / d.intake.kcal),
    target: (d) => (d.record === undefined ? undefined : (400 * d.record.targets.proteinG) / d.record.targets.kcal),
    unit: 'points',
    delta: 8,
    sigmaFloor: 2,
    roundTo: 1,
    goodDirection: undefined,
    detectors: [],
  }),
  // N9: calorie-dense foods; read per food by the level rule.
  calorieDensity: foodTrendSignal({
    id: 'calorieDensity',
    value: (d) => d.intake?.kcal,
    unit: 'kcal',
    delta: 100,
    sigmaFloor: 100,
    roundTo: 10,
    goodDirection: undefined,
    detectors: [],
  }),
  // N12: fiber against the guide, on days with enough fiber data (MM-126).
  fiber: foodTrendSignal({
    id: 'fiber',
    value: (d, span) => {
      if (span.input.fiber === undefined) return undefined;
      const day = FiberDay.of(d.entries);
      return day.enough ? day.totalG : undefined;
    },
    target: (d, span) =>
      span.input.fiber === undefined || d.record === undefined
        ? undefined
        : fiberGuideG({ kcalTarget: d.record.targets.kcal, sex: span.input.fiber.sex }),
    unit: 'g',
    delta: 3,
    sigmaFloor: 2,
    roundTo: 1,
    goodDirection: 'up',
  }),
  // N13: known sodium against the limit, on days it can be judged (MM-312).
  sodium: foodTrendSignal({
    id: 'sodium',
    value: (d, span) => {
      const sodium = span.input.sodium;
      if (sodium === undefined || d.date.isBefore(sodium.since)) return undefined;
      const day = SodiumDay.of(d.entries);
      return day.against(sodium.limitMg) === 'unknown' ? undefined : day.knownMg;
    },
    target: (_, span) => span.input.sodium?.limitMg,
    unit: 'mg',
    delta: 300,
    sigmaFloor: 200,
    roundTo: 50,
    goodDirection: 'down',
  }),
  // N14: calories against the day's planned target.
  calories: foodTrendSignal({
    id: 'calories',
    value: (d) => d.intake?.kcal,
    target: (d) => d.kcalTarget,
    unit: 'kcal',
    delta: 100,
    sigmaFloor: 100,
    roundTo: 10,
    goodDirection: undefined,
  }),
  // N15: intake against the energy expenditure the targets rest on; read as a span average.
  energyUse: foodTrendSignal({
    id: 'energyUse',
    value: (d) => d.intake?.kcal,
    target: (d) => (d.record?.tdeeStatus === 'updated' ? d.record.tdeeKcal : undefined),
    unit: 'kcal',
    delta: 100,
    sigmaFloor: 100,
    roundTo: 10,
    goodDirection: undefined,
    detectors: [],
  }),
  // N16: protein per 100 kcal by meal slot; read per slot by the level rule.
  mealBalance: foodTrendSignal({
    id: 'mealBalance',
    value: densityOf,
    target: requiredOf,
    unit: 'g per 100 kcal',
    delta: 1,
    sigmaFloor: 0.5,
    roundTo: 0.1,
    goodDirection: 'up',
    detectors: [],
  }),
};
