import type { CameraPreview } from '../domain/integration/CameraPreview';
import type { CapturedPhoto } from '../domain/integration/CapturedPhoto';
import type { PhotoCamera } from '../domain/integration/PhotoCamera';
import { photoPixelLimit } from '../domain/photos/photoPixelLimit';

/** How finely a progress photo's JPEG keeps detail. */
const quality = 0.85;

/**
 * The camera for progress photos (MM-157) through the web view's own media
 * devices, inside the app: the picture goes from the camera to the screen
 * and, when a photo is taken, to a canvas, reduced to about 2 megapixels
 * and kept as a JPEG. Nothing passes through the phone's camera app or
 * gallery, and nothing is sent anywhere.
 */
export class MediaDevicesPhotoCamera implements PhotoCamera {
  async start(facing: 'user' | 'environment'): Promise<CameraPreview | undefined> {
    const devices = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
    if (devices?.getUserMedia === undefined) return undefined;
    let stream: MediaStream;
    try {
      stream = await devices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false });
    } catch {
      return undefined;
    }
    let shown: HTMLVideoElement | undefined;
    return {
      attach: (video) => {
        shown = video;
        video.srcObject = stream;
        void video.play().catch(() => undefined);
      },
      capture: async (): Promise<CapturedPhoto> => {
        const video = shown;
        if (video === undefined || video.videoWidth === 0) throw new Error('The camera is not showing a picture yet.');
        const scale = Math.min(1, Math.sqrt(photoPixelLimit / (video.videoWidth * video.videoHeight)));
        const width = Math.max(1, Math.round(video.videoWidth * scale));
        const height = Math.max(1, Math.round(video.videoHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('The photo could not be drawn.');
        context.drawImage(video, 0, 0, width, height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob === null) throw new Error('The photo could not be kept.');
        return { jpeg: new Uint8Array(await blob.arrayBuffer()), width, height };
      },
      stop: () => {
        for (const track of stream.getTracks()) track.stop();
        if (shown !== undefined) shown.srcObject = null;
      },
    };
  }
}
