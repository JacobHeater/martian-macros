/**
 * Where the sources came from, written by the fetch step: the date goes in
 * the pack header, so a build never reads the clock.
 */
export interface BuildProvenance {
  /** An ISO date, the day the sources were downloaded. */
  readonly builtOn: string;

  /** Each source with its version and download date. */
  readonly sources: readonly string[];
}
