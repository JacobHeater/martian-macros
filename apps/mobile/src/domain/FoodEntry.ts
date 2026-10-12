import type { CalendarDate } from './CalendarDate';
import type { Portion } from './food/portion/Portion';
import type { Meal } from './Meal';
import type { QuantitySource } from './QuantitySource';

interface FoodEntryInit {
  id: number;
  date: CalendarDate;
  meal: Meal;
  name: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: QuantitySource;
  portion?: Portion | undefined;
  fiberG?: number | undefined;
  sodiumMg?: number | undefined;
  alcoholG?: number | undefined;
}

/** One logged food item. */
export class FoodEntry {
  /** Database id; 0 for an entry not yet saved. */
  readonly id: number;
  readonly date: CalendarDate;
  readonly meal: Meal;
  readonly name: string;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly source: QuantitySource;

  /**
   * How much was eaten and what the totals are for (MM-167). Undefined for
   * an entry logged before portions were recorded, and nothing is invented
   * for it. When present, its method is `source`.
   */
  readonly portion: Portion | undefined;

  /**
   * Nutrients beyond the four macros, kept when the source states them and
   * shown at Full detail (MM-49). Undefined means not known, never zero.
   */
  readonly fiberG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly alcoholG: number | undefined;

  constructor(init: FoodEntryInit) {
    this.id = init.id;
    this.date = init.date;
    this.meal = init.meal;
    this.name = init.name;
    this.kcal = init.kcal;
    this.proteinG = init.proteinG;
    this.carbsG = init.carbsG;
    this.fatG = init.fatG;
    this.source = init.source;
    this.portion = init.portion;
    this.fiberG = init.fiberG;
    this.sodiumMg = init.sodiumMg;
    this.alcoholG = init.alcoholG;
  }

  /** Energy from alcohol at 7 kcal per gram, or 0 when none is known (MM-127). */
  get alcoholKcal(): number {
    return 7 * (this.alcoholG ?? 0);
  }

  /** Carbohydrate less fiber, or undefined when fiber is not known. */
  get netCarbsG(): number | undefined {
    const fiber = this.fiberG;
    return fiber === undefined ? undefined : Math.max(0, this.carbsG - fiber);
  }
}
