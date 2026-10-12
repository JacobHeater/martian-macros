/** A portion of a food: "1 cup, sliced" and what it weighs. */
export interface CatalogServing {
  readonly description: string;
  readonly grams: number;
}
