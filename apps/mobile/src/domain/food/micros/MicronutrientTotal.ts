import type { Micronutrient } from './Micronutrient';

/**
 * One nutrient over a day's foods (MM-310): what the foods that state it add
 * up to, and how many of the day's foods that is. A food that does not state
 * it adds nothing and is not counted as zero.
 */
export class MicronutrientTotal {
  readonly nutrient: Micronutrient;

  /** The sum over the foods that state it, in the nutrient's unit. */
  readonly known: number;

  /** How many of the day's foods state it. */
  readonly stated: number;

  /** How many foods the day has. */
  readonly foods: number;

  constructor(init: { nutrient: Micronutrient; known: number; stated: number; foods: number }) {
    this.nutrient = init.nutrient;
    this.known = init.known;
    this.stated = init.stated;
    this.foods = init.foods;
  }

  /** No food today states it, so there is no number to show. */
  get noData(): boolean {
    return this.stated === 0;
  }

  /** Some of the day's foods do not state it, so `known` is a lower bound. */
  get partial(): boolean {
    return this.stated > 0 && this.stated < this.foods;
  }

  /**
   * Whether the day is over `limit` for certain: the known amount is already
   * above it, and a missing value can only add (MM-311).
   */
  over(limit: number): boolean {
    return this.known > limit;
  }
}
