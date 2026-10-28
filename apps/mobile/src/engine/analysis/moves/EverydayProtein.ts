import type { FoodGroup } from '../../../domain/food/FoodGroup';

/**
 * A lean protein food people buy and cook (MM-688): the words it is
 * searched by in the catalog, the pattern a catalog food's name must match
 * to be it, and its group.
 */
export interface EverydayProtein {
  readonly query: string;
  readonly name: RegExp;
  readonly group: FoodGroup;
}
