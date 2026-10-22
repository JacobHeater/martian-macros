/**
 * Where an imported workout came from (MM-490): the platform's own id for
 * it, so reading the platform again finds it and never adds a second
 * (MM-71), and the app or device that wrote it there.
 */
export interface ImportedWorkout {
  readonly platformId: string;
  readonly sourceName: string;
}
