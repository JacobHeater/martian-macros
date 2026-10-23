/**
 * A reasonable serving of one food on its own (MM-595): "1 tbsp" weighing
 * 15 g, whatever was eaten of it in the meal analysed. Logged with the food,
 * so it can be logged again from the log in an amount that makes sense.
 */
export interface UsualPortion {
  readonly description: string;
  readonly grams: number;
}
