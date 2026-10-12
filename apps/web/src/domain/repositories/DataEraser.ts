/** Deletes everything the app has stored (reset app). */
export interface DataEraser {
  eraseAll(): Promise<void>;
}
