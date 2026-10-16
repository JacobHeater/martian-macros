import { Micronutrient } from './Micronutrient';

/**
 * The micronutrients one food, serving or entry states (MM-308). A nutrient
 * the source did not state is unknown, never zero.
 */
export class Micronutrients {
  static readonly none = new Micronutrients({});

  private readonly amounts: Readonly<Partial<Record<Micronutrient, number>>>;

  constructor(amounts: Partial<Record<Micronutrient, number | undefined>>) {
    const known: Partial<Record<Micronutrient, number>> = {};
    for (const n of Micronutrient.values) {
      const amount = amounts[n];
      if (amount !== undefined && Number.isFinite(amount)) known[n] = amount;
    }
    this.amounts = Object.freeze(known);
  }

  /** The amount, in the nutrient's unit, or undefined when not stated. */
  of(nutrient: Micronutrient): number | undefined {
    return this.amounts[nutrient];
  }

  /** Whether no nutrient is stated. */
  get isEmpty(): boolean {
    return Object.keys(this.amounts).length === 0;
  }

  /** How many nutrients are stated. */
  get count(): number {
    return Object.keys(this.amounts).length;
  }

  /** The same, with `nutrient` set to `amount` (or made unknown). */
  with(nutrient: Micronutrient, amount: number | undefined): Micronutrients {
    return new Micronutrients({ ...this.amounts, [nutrient]: amount });
  }

  /** Every stated amount times `factor`, for an amount eaten. */
  times(factor: number): Micronutrients {
    const scaled: Partial<Record<Micronutrient, number>> = {};
    for (const n of Micronutrient.values) {
      const amount = this.amounts[n];
      if (amount !== undefined) scaled[n] = amount * factor;
    }
    return new Micronutrients(scaled);
  }
}
