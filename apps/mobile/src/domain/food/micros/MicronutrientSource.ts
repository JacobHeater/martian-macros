/** One food's share of a nutrient over a day (MM-561): its name and what it adds, in the nutrient's unit. */
export interface MicronutrientSource {
  readonly name: string;
  readonly amount: number;
}
