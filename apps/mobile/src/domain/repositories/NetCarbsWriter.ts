/** Writes whether carbohydrate is shown as net (MM-396). */
export interface NetCarbsWriter {
  saveNetCarbs(on: boolean): Promise<void>;
}
