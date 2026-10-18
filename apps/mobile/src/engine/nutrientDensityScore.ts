import type { GradeOmission } from '../domain/food/grade/GradeOmission';
import { FoodGradeRule } from './FoodGradeRule';
import { GradeMicronutrient } from './GradeMicronutrient';
import type { NutrientDensityBreakdown } from './NutrientDensityBreakdown';
import type { NutrientDensityInput } from './NutrientDensityInput';

/** One point per threshold the value reaches: for the lists that count for a food. */
const pointsReaching = (value: number, thresholds: readonly number[]) => thresholds.filter((t) => value >= t).length;

/** One point per threshold the value passes: for the lists that count against a food. */
const pointsPassing = (value: number, thresholds: readonly number[]) => thresholds.filter((t) => value > t).length;

/** One at `from` or below, zero at `to` or above, a straight line between. */
const shortfall = (value: number, { from, to }: { from: number; to: number }) => Math.min(1, Math.max(0, (to - value) / (to - from)));

/**
 * The nutrient-density score of a food (MM-380): what it gives per
 * 100 kcal. Protein, fiber and the vitamins and minerals count for it, read
 * per 100 kcal whatever its calories; sodium, sugars, saturated fat and
 * calories per gram count against it, the first three read per 100 kcal or
 * per `FoodGradeRule.againstFloorKcal` worth of a food with fewer calories
 * than that per 100 g. Higher is better. The caller has checked the food
 * has enough calories to grade per calorie and states what the method
 * requires; sugars, saturated fat and the vitamins and minerals are
 * counted only when stated.
 */
export function nutrientDensityScore(per100g: NutrientDensityInput): NutrientDensityBreakdown {
  const forPer100kcal = (value: number) => (value * 100) / per100g.kcal;
  const againstPer100kcal = (value: number) => (value * 100) / Math.max(per100g.kcal, FoodGradeRule.againstFloorKcal);
  const proteinPer = forPer100kcal(per100g.proteinG);
  const fiberPer = forPer100kcal(per100g.fiberG);
  const notCounted: GradeOmission[] = [];

  const protein = pointsReaching(proteinPer, FoodGradeRule.proteinGPer100Kcal);
  const fiber = pointsReaching(fiberPer, FoodGradeRule.fiberGPer100Kcal);

  const energyDensity = pointsPassing(per100g.kcal / 100, FoodGradeRule.kcalPerGram);
  const sodium = pointsPassing(againstPer100kcal(per100g.sodiumMg), FoodGradeRule.sodiumMgPer100Kcal);

  let sugarsKept: number | undefined;
  let sugars = 0;
  let countedSugarsPer = 0;
  if (per100g.sugarsG === undefined) {
    notCounted.push('sugars');
  } else {
    // Waived by the fiber and protein climbs together, only while the food is watery enough for the waiver to apply.
    const climb = 1 - shortfall(proteinPer, FoodGradeRule.sugarsWaiverProteinG) * shortfall(fiberPer, FoodGradeRule.sugarsWaiverFiberG);
    const watery = shortfall(per100g.kcal / 100, FoodGradeRule.sugarsWaiverKcalPerGram);
    sugarsKept = 1 - climb * watery;
    const sugarsPer = againstPer100kcal(per100g.sugarsG);
    countedSugarsPer = sugarsPer * sugarsKept;
    sugars = Math.floor(pointsPassing(sugarsPer, FoodGradeRule.sugarsGPer100Kcal) * sugarsKept + 0.5);
  }

  let saturatedFat = 0;
  if (per100g.saturatedFatG === undefined) notCounted.push('saturatedFat');
  else saturatedFat = pointsPassing(againstPer100kcal(per100g.saturatedFatG), FoodGradeRule.saturatedFatGPer100Kcal);

  const stated = GradeMicronutrient.values.filter((n) => per100g.micros[n] !== undefined);
  let micronutrientsPercent: number | undefined;
  let micronutrients = 0;
  if (stated.length >= FoodGradeRule.micronutrientsMinStated) {
    const shares = stated.map((n) =>
      Math.min(FoodGradeRule.micronutrientCapPercent, (forPer100kcal(per100g.micros[n] as number) / FoodGradeRule.dailyValues[n]) * 100),
    );
    micronutrientsPercent = shares.reduce((sum, s) => sum + s, 0) / stated.length;
    const breadth = shares.filter((s) => s >= FoodGradeRule.micronutrientBreadthPercent).length;
    micronutrients = Math.min(pointsReaching(micronutrientsPercent, FoodGradeRule.micronutrientsPercentPer100Kcal), breadth);
    const cap = FoodGradeRule.micronutrientsCapWithSugars;
    if (countedSugarsPer > cap.sugarsGPer100Kcal) micronutrients = Math.min(micronutrients, cap.points);
  } else {
    notCounted.push('micronutrients');
  }

  const points = { protein, fiber, micronutrients, energyDensity, sodium, sugars, saturatedFat };
  const score = protein + fiber + micronutrients - energyDensity - sodium - sugars - saturatedFat;
  return { score, points, micronutrientsPercent, statedMicronutrients: stated.length, sugarsKept, notCounted: order(notCounted) };
}

/** Sugars, saturated fat, then the vitamins and minerals, as the popover names them. */
function order(omissions: readonly GradeOmission[]): readonly GradeOmission[] {
  const sequence: readonly GradeOmission[] = ['sugars', 'saturatedFat', 'micronutrients'];
  return sequence.filter((o) => omissions.includes(o));
}
