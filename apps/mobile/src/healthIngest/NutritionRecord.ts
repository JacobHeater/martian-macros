/**
 * What was eaten over a span of time, to be written to the platform
 * (MM-70), so the app is a good citizen of the user's health data. A
 * nutrient the entry does not state is undefined, never zero.
 */
export interface NutritionRecord {
  /** The app's own id for it, so writing it again replaces it. */
  readonly id: string;
  readonly start: Date;
  readonly end: Date;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly name?: string | undefined;
  readonly meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | undefined;
  readonly fiberG?: number | undefined;
  readonly sugarsG?: number | undefined;
  readonly saturatedFatG?: number | undefined;
  readonly sodiumMg?: number | undefined;
}
