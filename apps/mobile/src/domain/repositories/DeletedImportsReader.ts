/**
 * The platform workouts that were imported and later deleted in the app
 * (MM-490), so a later read of the platform does not bring them back.
 */
export interface DeletedImportsReader {
  /** The platform ids of imported workouts deleted in the app. */
  deletedPlatformIds(): Promise<ReadonlySet<string>>;
}
