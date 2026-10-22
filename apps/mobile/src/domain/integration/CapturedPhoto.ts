/** A photo just taken (MM-157): a JPEG reduced to about 2 megapixels, and its size in pixels. */
export interface CapturedPhoto {
  readonly jpeg: Uint8Array;
  readonly width: number;
  readonly height: number;
}
