import type { CameraPreview } from './CameraPreview';

/**
 * The phone's camera for progress photos (MM-157). Photos are taken inside
 * the app: never through the phone's camera app, so none reaches the
 * phone's gallery.
 */
export interface PhotoCamera {
  /**
   * Starts the camera facing `facing`; undefined when there is no camera
   * or the person did not allow it.
   */
  start(facing: 'user' | 'environment'): Promise<CameraPreview | undefined>;
}
