import type { CoachAdvice } from '../CoachAdvice';
import type { CoachTrade } from '../CoachTrade';

/** MM-607's trade as an order (MM-617): swap X for Y, each at the portion the trade picked. */
export function tradeAdviceOf(trade: CoachTrade, kind: 'swap' | 'halve' = 'swap'): CoachAdvice {
  const { x, y } = trade;
  return {
    kind,
    food: { key: x.name.trim().toLowerCase(), name: x.name, kcal: x.kcal, fatG: x.fatG, proteinG: x.proteinG, sodiumMg: x.sodiumMg },
    replacement: { name: y.name, kcal: y.kcal, proteinG: y.proteinG, fatG: y.fatG, source: trade.source },
  };
}
