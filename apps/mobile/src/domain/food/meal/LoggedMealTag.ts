/**
 * What makes a food one of a meal (MM-587): the meal's key, shared by every
 * food of it and by nothing else, and the meal's name. The foods are still
 * ordinary entries; the tag only groups them.
 */
export interface LoggedMealTag {
  readonly key: string;
  readonly name: string;
}
