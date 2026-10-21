/** Writes the scale the person chose as primary in Settings (MM-71). */
export interface PrimaryScaleWriter {
  /** Undefined goes back to choosing automatically. */
  savePrimaryScale(sourceId: string | undefined): Promise<void>;
}
