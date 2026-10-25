import type { CoachTrade } from '../CoachTrade';
import { TradeRule } from '../TradeRule';

/** A food's figures, a time; `grams` where the portion's weight is known. */
interface Figures {
  readonly kcal: number;
  readonly proteinG: number;
  readonly fatG: number;
  readonly sodiumMg: number | undefined;
  readonly grams: number | undefined;
}

/**
 * What Y gains over X a time for a motive (MM-607), or undefined when Y
 * does not meet the motive's rules:
 * - protein: `TradeRule.proteinDensityGainG` more per 100 kcal and `proteinGainG` more a time;
 * - fat: a fat share `fatShareDrop` lower, `fatDropG` less a time, protein no lower;
 * - calories: `kcalDrop` less a time, protein no lower, calories per gram no higher where both are known;
 * - sodium: sodium per 100 kcal at most `sodiumDensityRatio` of X's, both stated.
 */
export function tradeGainOf(motive: CoachTrade['motive'], x: Figures, y: Figures): number | undefined {
  switch (motive) {
    case 'protein': {
      const gain = y.proteinG - x.proteinG;
      const denser = (100 * y.proteinG) / y.kcal - (100 * x.proteinG) / x.kcal >= TradeRule.proteinDensityGainG;
      return denser && gain >= TradeRule.proteinGainG ? gain : undefined;
    }
    case 'fat': {
      const drop = x.fatG - y.fatG;
      const leaner = (9 * x.fatG) / x.kcal - (9 * y.fatG) / y.kcal >= TradeRule.fatShareDrop;
      return leaner && drop >= TradeRule.fatDropG && y.proteinG >= x.proteinG ? drop : undefined;
    }
    case 'calories': {
      const drop = x.kcal - y.kcal;
      if (drop < TradeRule.kcalDrop || y.proteinG < x.proteinG) return undefined;
      if (x.grams !== undefined && y.grams !== undefined && x.grams > 0 && y.grams > 0 && y.kcal / y.grams > x.kcal / x.grams) {
        return undefined;
      }
      return drop;
    }
    case 'sodium': {
      if (x.sodiumMg === undefined || y.sodiumMg === undefined || !(x.sodiumMg > 0)) return undefined;
      const lower = (100 * y.sodiumMg) / y.kcal <= TradeRule.sodiumDensityRatio * ((100 * x.sodiumMg) / x.kcal);
      return lower ? x.sodiumMg - y.sodiumMg : undefined;
    }
  }
}
