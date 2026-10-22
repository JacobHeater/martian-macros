import type { CameraPreview } from './CameraPreview';
import type { PhotoCameraProblem } from './PhotoCameraProblem';

/**
 * The phone's camera for progress photos (MM-157). Photos are taken inside
 * the app: never through the phone's camera app, so none reaches the
 * phone's gallery.
 */
export interface PhotoCamera {
  /**
   * Starts the camera facing `facing`, or says why it did not (MM-560):
   * not allowed, no camera, busy, or a page that may use none. Never
   * throws.
   */
  start(facing: 'user' | 'environment'): Promise<CameraPreview | PhotoCameraProblem>;
}
