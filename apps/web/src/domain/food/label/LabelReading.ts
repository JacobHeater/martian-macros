interface LabelReadingInit {
  servingText?: string | undefined;
  servingGrams?: number | undefined;
  kcal?: number | undefined;
  proteinG?: number | undefined;
  carbsG?: number | undefined;
  fatG?: number | undefined;
  fiberG?: number | undefined;
  sodiumMg?: number | undefined;
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
  readonly sodiumMg: number | undefined;

  constructor(init: LabelReadingInit = {}) {
    this.servingText = init.servingText;
    this.servingGrams = init.servingGrams;
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.carbsG = init.carbsG;
    this.fatG = init.fatG;
    this.fiberG = init.fiberG;
    this.sodiumMg = init.sodiumMg;
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
