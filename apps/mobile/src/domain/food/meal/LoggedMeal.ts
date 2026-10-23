import { ArgumentError } from '../../../lang/ArgumentError';
import type { CalendarDate } from '../../CalendarDate';
import type { FoodEntry } from '../../FoodEntry';
import type { Meal } from '../../Meal';

/**
 * Several foods eaten together and logged under one name (MM-587): the
 * entries that share a meal key, in the order they were logged. Its day,
 * slot and time are its first food's; its totals are its foods' sums.
 */
export class LoggedMeal {
  readonly key: string;
  readonly name: string;
  readonly items: readonly FoodEntry[];

  constructor(items: readonly FoodEntry[]) {
    const first = items[0];
    const tag = first?.loggedMeal;
    if (first === undefined || tag === undefined || items.some((item) => item.loggedMeal?.key !== tag.key)) {
      throw new ArgumentError('A meal is one or more foods that share its key.');
    }
    this.key = tag.key;
    this.name = tag.name;
    this.items = items;
  }

  get date(): CalendarDate {
    return (this.items[0] as FoodEntry).date;
  }

  get meal(): Meal {
    return (this.items[0] as FoodEntry).meal;
  }

  get eatenAt(): number | undefined {
    return (this.items[0] as FoodEntry).eatenAt;
  }

  get kcal(): number {
    return this.sum((item) => item.kcal);
  }

  get proteinG(): number {
    return this.sum((item) => item.proteinG);
  }

  get carbsG(): number {
    return this.sum((item) => item.carbsG);
  }

  get netCarbsG(): number {
    return this.sum((item) => item.netCarbsG);
  }

  get fatG(): number {
    return this.sum((item) => item.fatG);
  }

  private sum(of: (item: FoodEntry) => number): number {
    return this.items.reduce((total, item) => total + of(item), 0);
  }
}
