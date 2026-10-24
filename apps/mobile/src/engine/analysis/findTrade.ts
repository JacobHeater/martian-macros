import type { CoachTrade } from './CoachTrade';
import { findTrades } from './findTrades';
import type { TradeInput } from './TradeInput';

/**
 * The trade a finding in change carries (MM-607): the best of `findTrades`,
 * or undefined when no Y qualifies (the MM-606 side then offers an add, or
 * states the fact) or a safeguard keeps it quiet.
 */
export function findTrade(input: TradeInput): CoachTrade | undefined {
  return findTrades(input)[0];
}
