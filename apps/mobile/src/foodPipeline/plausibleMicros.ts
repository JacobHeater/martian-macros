import { Micronutrient } from '../domain/food/micros/Micronutrient';
import type { PackMicros } from '../foodCatalog/PackMicros';
import { PackMicronutrient } from '../foodCatalog/PackMicronutrient';
import type { CandidateFood } from './CandidateFood';

/**
 * The micronutrients of `food` a pack keeps: a value below zero or above the
 * most a plausible 100 g holds is dropped, never the food (MM-307). A food
 * stated per 100 mL may weigh up to 150 g (honey), so its ceilings are half
 * as much again (MM-650): a syrup's sugars are not lost for its density.
 */
export function plausibleMicros(food: CandidateFood): PackMicros {
  const kept: Partial<Record<PackMicronutrient, number>> = {};
  const mass = food.basis === 'per100ml' ? 1.5 : 1;
  for (const n of PackMicronutrient.values) {
    const value = food.micros[n];
    if (value !== undefined && value >= 0 && value <= Micronutrient.maxPer100g(n) * mass) kept[n] = value;
  }
  return kept;
}
