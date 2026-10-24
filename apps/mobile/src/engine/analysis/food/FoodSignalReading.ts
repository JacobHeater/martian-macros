import type { Meal } from '../../../domain/Meal';
import type { TrendDirection } from '../../trends/TrendDirection';
import type { CoachFood } from '../CoachFood';
import type { FoodSignalId } from './FoodSignalId';

/**
 * One food signal's level rules over a span's judged days (MM-606): its
 * figures, whether the "change when" column holds and which way, and
 * whether the "holding up when" column does. Gates between signals and the
 * safeguards are applied after, by `analyseFoodSpan`.
 */
export interface FoodSignalReading {
  readonly signal: FoodSignalId;

  /** The span's figures by name, whether or not anything holds. */
  readonly figures: Readonly<Record<string, number>>;

  /** The way the change column holds, or undefined when it does not. */
  readonly change: TrendDirection | undefined;

  readonly holdingUp: boolean;

  /** Foods the rule itself names (N9's calorie-dense foods, N12's examples); the others' are found after (N11). */
  readonly foods: readonly CoachFood[] | undefined;

  /** The meal slot it is about (N3, N16, N9's holding up). */
  readonly meal: Meal | undefined;
}
