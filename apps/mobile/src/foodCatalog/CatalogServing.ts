/**
 * A portion of a food: "1 cup, sliced" and what it weighs, or what volume it
 * is, or both (MM-650). A weight is what the source states for that form of
 * the food; a volume is the millilitres a drink's source states ("1 can
 * (355 mL)"). At least one is present and above zero.
 */
export interface CatalogServing {
  readonly description: string;
  readonly grams?: number | undefined;
  readonly milliliters?: number | undefined;
}
