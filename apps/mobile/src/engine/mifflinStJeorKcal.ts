import type { BiologicalSex } from '../domain/BiologicalSex';

/** Mifflin-St Jeor resting energy expenditure, kcal/day. */
export function mifflinStJeorKcal({
  sex,
  weightKg,
  heightCm,
  ageYears,
}: {
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}
