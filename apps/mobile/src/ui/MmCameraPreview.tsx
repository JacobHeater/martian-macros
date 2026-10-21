import { useEffect, useRef } from 'react';
import { base64OfBytes } from '../lang/base64OfBytes';
import './ui.css';

interface MmCameraPreviewProps {
  /** Shows the camera's live picture in the video it is given; undefined while there is none. */
  attach: ((video: HTMLVideoElement) => void) | undefined;
  /** The last photo of the same pose, drawn faintly over the picture to line the new one up with it. */
  overlay: Uint8Array | undefined;
  /** What the overlay is, for a reader. */
  overlayLabel?: string;
  /**
   * The self-timer's seconds left, drawn large over the picture so they can
   * be read from where the person stands; the screen says them aloud.
   */
  countdown?: number | undefined;
}

/**
 * The camera's picture for a progress photo (MM-157), in a portrait frame,
 * with the last photo of the same pose laid over it faintly, so distance
 * and framing can be matched. Nothing is drawn natively: the picture is a
 * video the design system frames.
 */
export function MmCameraPreview({
  attach,
  overlay,
  overlayLabel = 'The last photo of this pose, faint, to line up with',
  countdown,
}: MmCameraPreviewProps) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (attach !== undefined && video.current !== null) attach(video.current);
  }, [attach]);
  return (
    <div className="mm-camera" onContextMenu={(event) => event.preventDefault()}>
      <video ref={video} className="mm-camera-video" muted playsInline autoPlay aria-label="The camera’s picture" />
      {overlay === undefined ? null : (
        <img
          className="mm-camera-overlay"
          src={`data:image/jpeg;base64,${base64OfBytes(overlay)}`}
          alt={overlayLabel}
          // Never offered to save or share by a long press or a drag (MM-157): the stylesheet's `.mm-camera` too.
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />
      )}
      {countdown === undefined ? null : (
        <span className="mm-camera-countdown" aria-hidden="true">
          {countdown}
        </span>
      )}
    </div>
  );
}
