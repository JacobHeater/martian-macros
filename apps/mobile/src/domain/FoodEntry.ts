import { ArgumentError } from '../lang/ArgumentError';
import type { CalendarDate } from './CalendarDate';
import type { FoodEvidence } from './food/meal/FoodEvidence';
import type { LoggedMealTag } from './food/meal/LoggedMealTag';
import { Micronutrients } from './food/micros/Micronutrients';
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
  sugarAlcoholsG?: number | undefined;
  sodiumMg?: number | undefined;
  alcoholG?: number | undefined;
  /** Sodium may be given here or as `sodiumMg`; `sodiumMg` wins. */
  micros?: Micronutrients | undefined;
  eatenAt?: number | undefined;
  loggedMeal?: LoggedMealTag | undefined;
  evidence?: FoodEvidence | undefined;
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
  /** Sugar alcohols as stated (MM-397); undefined when not stated. */
  readonly sugarAlcoholsG: number | undefined;
  readonly sodiumMg: number | undefined;
  readonly alcoholG: number | undefined;

  /**
   * The micronutrients the source stated, scaled to the amount eaten
   * (MM-308), sodium among them. Unknown is never zero.
   */
  readonly micros: Micronutrients;

  /**
   * When it was eaten (MM-570): minutes after local midnight of the entry's
   * own `date`, 0 to 1439. Undefined when not known (an entry logged for an
   * earlier day, copied from another day, or logged before times were
   * recorded), and nothing is invented for it.
   */
  readonly eatenAt: number | undefined;

  /**
   * The meal this food is one of (MM-587), when it was logged as part of
   * one; undefined for a food logged on its own.
   */
  readonly loggedMeal: LoggedMealTag | undefined;

  /**
   * Where its numbers came from, for a food of an analysed meal (MM-586);
   * undefined for every other food, whose method and source say it.
   */
  readonly evidence: FoodEvidence | undefined;

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
    this.sugarAlcoholsG = init.sugarAlcoholsG;
    const micros = init.micros ?? Micronutrients.none;
    this.sodiumMg = init.sodiumMg ?? micros.of('sodium');
    this.micros = micros.with('sodium', this.sodiumMg);
    this.alcoholG = init.alcoholG;
    const eatenAt = init.eatenAt;
    if (eatenAt !== undefined && !(Number.isInteger(eatenAt) && eatenAt >= 0 && eatenAt < 24 * 60)) {
      throw new ArgumentError('A food is eaten at a whole minute of its day, from 0 to 1439.');
    }
    this.eatenAt = eatenAt;
    this.loggedMeal = init.loggedMeal;
    this.evidence = init.evidence;
  }

  /**
   * The same food with `changes` (MM-587): a meal's foods moved, renamed or
   * logged again. New micronutrients bring their own sodium.
   */
  copyWith(changes: Partial<FoodEntryInit>): FoodEntry {
    return new FoodEntry({
      id: this.id,
      date: this.date,
      meal: this.meal,
      name: this.name,
      kcal: this.kcal,
      proteinG: this.proteinG,
      carbsG: this.carbsG,
      fatG: this.fatG,
      source: this.source,
      portion: this.portion,
      fiberG: this.fiberG,
      sugarAlcoholsG: this.sugarAlcoholsG,
      alcoholG: this.alcoholG,
      micros: this.micros,
      eatenAt: this.eatenAt,
      loggedMeal: this.loggedMeal,
      evidence: this.evidence,
      ...changes,
      sodiumMg: 'sodiumMg' in changes ? changes.sodiumMg : changes.micros === undefined ? this.sodiumMg : undefined,
    });
  }

  /** Energy from alcohol at 7 kcal per gram, or 0 when none is known (MM-127). */
  get alcoholKcal(): number {
    return 7 * (this.alcoholG ?? 0);
  }

  /**
   * Carbohydrate less the fiber and sugar alcohols stated for it (MM-396):
   * what is not stated is not subtracted, and labels round each line on its
   * own, so it never goes below zero.
   */
  get netCarbsG(): number {
    return Math.max(0, this.carbsG - (this.fiberG ?? 0) - (this.sugarAlcoholsG ?? 0));
  }
}
