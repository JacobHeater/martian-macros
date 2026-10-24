/** The methods of a native plugin that pick a meal's photos and share them with the prompt (MM-599). Photos cross as base64 JPEG. */
export interface MmMealShareApi {
  /** The phone's photo picker, for up to `max` photos, each reduced to about 2 megapixels; none when cancelled. */
  pickPhotos(options: { max: number }): Promise<{ photos: { data: string; width: number; height: number }[] }>;
  /** The share sheet with the photos and the text together. */
  shareMeal(options: { text: string; photos: string[] }): Promise<{ outcome: 'sent' | 'cancelled' }>;
  /** Deletes the files the last `shareMeal` wrote. */
  clearMealShare(): Promise<void>;
}
