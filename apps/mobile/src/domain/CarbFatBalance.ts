import { clamp } from '../lang/clamp';

/**
 * The user's balance of carbohydrate and fat after protein (MM-122): fat as
 * a share of calories, never below the fat minimum, carbohydrate the rest.
 * A proportion, not grams, so it carries across check-ins as calories
 * change. Protein and calories are never touched by it.
 */
export class CarbFatBalance {
  /** "More carbs": fat at its minimum, which is never under 20% of calories. */
  static readonly moreCarbsFatShare = 0.2;
  static readonly balancedFatShare = 0.3;
  static readonly moreFatFatShare = 0.4;

  /**
   * MM-24's share, which stands until the user chooses (with no carbohydrate
   * floor); Balanced becomes the default with MM-486.
   */
  static readonly unchosenFatShare = 0.25;

  /**
   * Carbohydrate kept unless the user turns it off (judgement: a default
   * user who trains stays out of the range where training commonly feels
   * worse in the first weeks; no claim beyond that).
   */
  static readonly carbFloorG = 100;

  static readonly balanced = new CarbFatBalance({ fatShare: CarbFatBalance.balancedFatShare });

  /** Fat's share of calories, from `moreCarbsFatShare` to `moreFatFatShare`. */
  readonly fatShare: number;

  /** "I eat very low carb on purpose": the carbohydrate floor does not apply. */
  readonly carbFloorOff: boolean;

  constructor({ fatShare, carbFloorOff = false }: { fatShare: number; carbFloorOff?: boolean }) {
    this.fatShare = clamp(fatShare, CarbFatBalance.moreCarbsFatShare, CarbFatBalance.moreFatFatShare);
    this.carbFloorOff = carbFloorOff;
  }
}
