import type { CapturedPhoto } from './CapturedPhoto';

/**
 * The camera while it runs for a progress photo (MM-157). What it sees is
 * drawn by the screen, never kept until a photo is taken, and never sent
 * anywhere.
 */
export interface CameraPreview {
  /** Shows the live picture in `video`. */
  attach(video: HTMLVideoElement): void;

  /** The picture now, reduced to about 2 megapixels. */
  capture(): Promise<CapturedPhoto>;

  /** Turns the camera off. */
  stop(): void;
}
