/** One weigh-in typed in the app, to be written to the platform (MM-513). */
export interface BodyWeightRecord {
  /** The app's own id for it, so writing it again replaces it and it can be removed. */
  readonly id: string;

  /** When it is said to have been weighed. */
  readonly at: Date;
  readonly kg: number;
}
