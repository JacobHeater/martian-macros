/**
 * The person's choices about progress photos (MM-157), kept with the photos.
 */
export interface PhotoSettings {
  /**
   * Whether the photo section is offered. Undefined until chosen in
   * Settings: then it is offered unless the health check records an
   * eating-disorder history (MM-11).
   */
  readonly offered: boolean | undefined;

  /** Whether the app's own encrypted backup carries the photos (MM-63). Off until turned on. */
  readonly backUp: boolean;
}
