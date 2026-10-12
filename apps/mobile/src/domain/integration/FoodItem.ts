/** A food from a catalog, with its nutrition for one serving. */
export interface FoodItem {
  /** Stable within its catalog. */
  readonly id: string;
  readonly name: string;
  readonly brand?: string | undefined;

  /** GTIN-14, if the item is a packaged product. */
  readonly barcode?: string | undefined;

  /** For example "1 cup (240 g)". */
  readonly servingLabel: string;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
}
