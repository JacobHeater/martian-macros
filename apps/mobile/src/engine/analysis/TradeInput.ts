import type { Caution } from '../../domain/Caution';
import type { FoodEntry } from '../../domain/FoodEntry';
import type { Micronutrient } from '../../domain/food/micros/Micronutrient';
import type { GoalMode } from '../../domain/GoalMode';
import type { InsightSafeguards } from '../InsightSafeguards';
import type { CoachTrade } from './CoachTrade';
import type { TradeCatalog } from './TradeCatalog';

/** What `findTrade` reads (MM-607), given by a finding in change (MM-606). */
export interface TradeInput {
  /** What the trade is for: the finding's motive. */
  readonly motive: CoachTrade['motive'];
  readonly goal: GoalMode;
  /** The span's whole, unmarked days' entries: where X comes from. */
  readonly spanEntries: readonly FoodEntry[];
  /** The last 56 days' entries: where the person's own Y comes from. */
  readonly history: readonly FoodEntry[];
  /** The catalog by food group; undefined when no pack is installed. */
  readonly catalog: TradeCatalog | undefined;
  readonly safeguards: InsightSafeguards;
  /** The coaching policy's cautions, added to the safeguards' own. */
  readonly cautions: ReadonlySet<Caution>;
  /** MM-606 signal ids active in change, e.g. `sodium` and `fiber`: a trade does them no harm. */
  readonly activeSignals: ReadonlySet<string>;
  /** Whether the span left calorie room: the add fallback's, decided on the MM-606 side. */
  readonly calorieRoom: boolean;
  /** The span's whole days, the divisor of a trade's gain a day. */
  readonly spanDays: number;
  /** The day's calorie floor (`SafetyBounds`): no trade takes the span's average under it. Unchecked when not given. */
  readonly calorieFloorKcal?: number | undefined;
  /**
   * The daily reference of each micronutrient that has one for this person
   * (`referenceAmount`): X is never the top source of one averaging under it.
   * Unchecked when not given.
   */
  readonly microReferences?: ReadonlyMap<Micronutrient, number> | undefined;
  /** Foods the person snoozed (MM-378), by name in lower case: never an X or a Y. */
  readonly snoozed?: ReadonlySet<string> | undefined;
}
