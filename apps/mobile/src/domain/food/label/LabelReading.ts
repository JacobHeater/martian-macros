import { Micronutrients } from '../micros/Micronutrients';
import type { LabelField } from './LabelField';

interface LabelReadingInit {
  servingText?: string | undefined;
  servingGrams?: number | undefined;
  kcal?: number | undefined;
  proteinG?: number | undefined;
  carbsG?: number | undefined;
  fatG?: number | undefined;
  fiberG?: number | undefined;
  sugarAlcoholsG?: number | undefined;
  sodiumMg?: number | undefined;
  micros?: Micronutrients;
  unsure?: Iterable<LabelField>;
}

/**
 * What was read from a Nutrition Facts panel (MM-44). Every field is
 * undefined when the reader did not find it, so the form can ask rather than
 * guess. Numbers are per serving, as the US label states them.
 */
export class LabelReading {
  /** "2/3 cup (55g)", as printed. */
  readonly servingText: string | undefined;
  readonly servingGrams: number | undefined;
  readonly kcal: number | undefined;
  readonly proteinG: number | undefined;
  readonly carbsG: number | undefined;
  readonly fatG: number | undefined;
  readonly fiberG: number | undefined;
  /** Sugar alcohols, when the label prints them in grams (MM-397). */
  readonly sugarAlcoholsG: number | undefined;
  readonly sodiumMg: number | undefined;

  /**
   * The other lines read with an amount and its unit (MM-309), per serving;
   * sodium is `sodiumMg`.
   */
  readonly micros: Micronutrients;

  /**
   * The numbers the reader was unsure of, to be marked for checking: a digit
   * repaired from a look-alike letter, a value paired with its label only by
   * position in a column, or a value the serving's weight makes impossible.
   */
  readonly unsure: ReadonlySet<LabelField>;

  constructor(init: LabelReadingInit = {}) {
    this.servingText = init.servingText;
    this.servingGrams = init.servingGrams;
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.carbsG = init.carbsG;
    this.fatG = init.fatG;
    this.fiberG = init.fiberG;
    this.sugarAlcoholsG = init.sugarAlcoholsG;
    this.sodiumMg = init.sodiumMg;
    this.micros = init.micros ?? Micronutrients.none;
    this.unsure = new Set(init.unsure ?? []);
  }

  /** Whether nothing usable was found. */
  get isEmpty(): boolean {
    return (
      this.kcal === undefined &&
      this.proteinG === undefined &&
      this.carbsG === undefined &&
      this.fatG === undefined
    );
  }
}
