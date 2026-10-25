import type { CoachAdvice } from '../CoachAdvice';
import { adviceAllowed } from './adviceAllowed';
import type { FoodLimits } from './FoodLimits';

/**
 * The orders the safeguards let a finding carry (MM-617): `primary` as
 * `adviceAllowed` leaves them, or, when it leaves none, `fallback` the same
 * way. Empty when neither has one: the fix is then not said.
 */
export function allowedOrders(limits: FoodLimits, primary: readonly CoachAdvice[], fallback: readonly CoachAdvice[] = []): CoachAdvice[] {
  const kept = primary.filter((a) => adviceAllowed(a, limits));
  return kept.length > 0 ? kept : fallback.filter((a) => adviceAllowed(a, limits));
}
