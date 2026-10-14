import { Micronutrient } from '../domain/food/micros/Micronutrient';
import type { PackMicros } from '../foodCatalog/PackMicros';
import { PackMicronutrient } from '../foodCatalog/PackMicronutrient';
import type { CandidateFood } from './CandidateFood';

/**
 * The micronutrients of `food` a pack keeps: a value below zero or above the
 * most a plausible 100 g holds is dropped, never the food (MM-307).
 */
export function plausibleMicros(food: CandidateFood): PackMicros {
  const kept: Partial<Record<PackMicronutrient, number>> = {};
  for (const n of PackMicronutrient.values) {
    const value = food.micros[n];
    if (value !== undefined && value >= 0 && value <= Micronutrient.maxPer100g(n)) kept[n] = value;
  }
  return kept;
}
