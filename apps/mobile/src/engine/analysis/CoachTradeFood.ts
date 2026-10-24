import type { Portion } from '../../domain/food/portion/Portion';

/**
 * One side of a trade X for Y (MM-607): a food at the person's usual
 * portion (the median of their logged instances), or a catalog food at its
 * default serving. Undefined means not stated, never zero.
 */
export interface CoachTradeFood {
  readonly name: string;
  readonly kcal: number;
  readonly proteinG: number;
  readonly fatG: number;
  /** Its sodium a time, where it is stated: a sodium trade names both sides' (MM-607). */
  readonly sodiumMg?: number | undefined;
  /** The usual portion the trade picked, as it was logged; the words say it ("80 g"). */
  readonly portion?: Portion | undefined;
  /** What that portion weighs, where it is known: a catalog food's default serving. */
  readonly grams?: number | undefined;
}
