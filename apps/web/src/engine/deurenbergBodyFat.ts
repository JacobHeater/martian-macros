import type { BiologicalSex } from '../domain/BiologicalSex';
import { clamp } from '../lang/clamp';
import { BodyFatEstimate } from './BodyFatEstimate';

/**
 * Deurenberg (1991) body-fat estimate from BMI, age, and sex.
 *
 * Used only as a starting value when the user has no measurement; carries
 * a wide 5-point uncertainty.
 */
export function deurenbergBodyFat({
  sex,
  weightKg,
  heightCm,
  ageYears,
}: {
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): BodyFatEstimate {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const male = sex === 'male' ? 1 : 0;
  const percent = 1.2 * bmi + 0.23 * ageYears - 10.8 * male - 5.4;
  return new BodyFatEstimate({ percent: clamp(percent, 3, 60), sigmaPercent: 5 });
}
