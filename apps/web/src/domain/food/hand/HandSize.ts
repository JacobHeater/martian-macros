import type { BiologicalSex } from '../../BiologicalSex';

/**
 * What the hand model needs to know about a person (MM-46): the two things
 * that set the size of their hand.
 */
export interface HandSize {
  readonly heightCm: number;
  readonly sex: BiologicalSex;
}
