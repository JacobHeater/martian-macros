import { Micronutrient } from '../domain/food/micros/Micronutrient';
import type { Micronutrients } from '../domain/food/micros/Micronutrients';
import { orNull } from './columns';
import type { Values } from './Values';

/** The columns MM-308 added, from `micros`; sodium is written by its own field. */
export function microsValues(micros: Micronutrients): Values {
  return Object.fromEntries(Micronutrient.added.map((n) => [Micronutrient.column(n), orNull(micros.of(n))]));
}
