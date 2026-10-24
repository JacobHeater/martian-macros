import type { Meal } from '../../domain/Meal';
import type { CoachTradeFood } from './CoachTradeFood';
import type { CoachTradeSource } from './CoachTradeSource';

/** Trade X for Y (MM-607), each at the person's usual portion. Words are past or conditional. */
export interface CoachTrade {
  readonly motive: 'protein' | 'fat' | 'calories' | 'sodium';
  readonly meal: Meal | undefined;
  readonly x: CoachTradeFood;
  readonly y: CoachTradeFood;
  readonly source: CoachTradeSource;
  /** Days X was eaten in the span. */
  readonly days: number;
  /** Protein (or fat, or sodium, by motive) gained per day of the span had the trade been made. */
  readonly gainPerDay: number;
  /** Y's calories minus X's, a time. */
  readonly deltaKcal: number;
}
