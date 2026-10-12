import type { BiologicalSex } from '../../BiologicalSex';

/**
 * The day's fiber guide in grams (MM-126): 14 g per 1,000 kcal of the calorie
 * target, never below 25 g for men or 21 g for women, so a low target does
 * not lower it much. A guide, never a goal that is judged.
 */
export function fiberGuideG({ kcalTarget, sex }: { kcalTarget: number; sex: BiologicalSex }): number {
  const minimum = sex === 'male' ? 25 : 21;
  const scaled = (kcalTarget * 14) / 1000;
  return scaled > minimum ? scaled : minimum;
}
