/**
 * Body mass index, kg per square metre.
 *
 * Poor as a measure of fatness in muscular people, but at the low end it is
 * the right tool: it needs only height and weight, which the app measures
 * well, and nobody is underweight by BMI because of muscle. The limits it
 * is held against are in `lowWeightLimits`.
 */
export function bodyMassIndex({ weightKg, heightCm }: { weightKg: number; heightCm: number }): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}
