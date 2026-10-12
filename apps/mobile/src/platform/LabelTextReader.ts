/**
 * Photographs a Nutrition Facts panel and gives the text on it (MM-44). The
 * app depends on this, not on a camera or recognition plugin, so tests use
 * a fake and the plugin can be replaced. Nothing leaves the phone.
 */
export interface LabelTextReader {
  /** The recognised text, or undefined when the person cancelled. It fails when the camera cannot be used. */
  readLabel(): Promise<string | undefined>;
}
