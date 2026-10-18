import { GradeMicronutrient } from './GradeMicronutrient';

/**
 * The vitamins and minerals the grade counts, read one by one and scaled
 * (to per 100 g); one not stated is left out, never zero (MM-310).
 */
export function gradeMicrosFrom(
  read: (nutrient: GradeMicronutrient) => number | undefined,
  scale = 1,
): Readonly<Partial<Record<GradeMicronutrient, number>>> {
  const micros: Partial<Record<GradeMicronutrient, number>> = {};
  for (const n of GradeMicronutrient.values) {
    const amount = read(n);
    if (amount !== undefined) micros[n] = amount * scale;
  }
  return micros;
}
