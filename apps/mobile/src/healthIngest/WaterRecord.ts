/** One drink of water, to be written to the platform (MM-314). */
export interface WaterRecord {
  /** The app's own id for it, so writing it again replaces it and it can be removed. */
  readonly id: string;

  /** When it was logged. */
  readonly at: Date;
  readonly ml: number;
}
