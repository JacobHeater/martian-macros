import type { BiologicalSex } from '../../BiologicalSex';
import type { Micronutrient } from './Micronutrient';

/**
 * The US Dietary Reference Intake for an adult of `sex` and `age` (MM-310):
 * the RDA, or the AI where there is no RDA (potassium), in the nutrient's
 * unit. Undefined for sodium, sugars, saturated fat and cholesterol, which
 * have no amount to reach, and under 19, where the bands differ.
 *
 * Sources: the NIH Office of Dietary Supplements' health-professional fact
 * sheets (tables of RDAs and AIs), which reproduce the National Academies'
 * DRI reports; potassium is the 2019 AI.
 */
export function referenceAmount(
  nutrient: Micronutrient,
  { sex, age }: { sex: BiologicalSex; age: number },
): number | undefined {
  if (age < 19) return undefined;
  const male = sex === 'male';
  switch (nutrient) {
    case 'potassium':
      return male ? 3_400 : 2_600;
    case 'calcium':
      return (male ? age > 70 : age > 50) ? 1_200 : 1_000;
    case 'iron':
      return !male && age <= 50 ? 18 : 8;
    case 'magnesium':
      if (male) return age <= 30 ? 400 : 420;
      return age <= 30 ? 310 : 320;
    case 'zinc':
      return male ? 11 : 8;
    case 'vitaminA':
      return male ? 900 : 700;
    case 'vitaminC':
      return male ? 90 : 75;
    case 'vitaminD':
      return age > 70 ? 20 : 15;
    case 'vitaminB12':
      return 2.4;
    case 'folate':
      return 400;
    case 'sodium':
    case 'sugars':
    case 'saturatedFat':
    case 'cholesterol':
      return undefined;
  }
}
