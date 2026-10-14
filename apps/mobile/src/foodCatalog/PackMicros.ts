import type { PackMicronutrient } from './PackMicronutrient';

/** What one pack food states of the format 2 micronutrients, per 100 g; a nutrient left out is unknown. */
export type PackMicros = Readonly<Partial<Record<PackMicronutrient, number>>>;
