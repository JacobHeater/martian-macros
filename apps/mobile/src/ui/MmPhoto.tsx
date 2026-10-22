import { base64OfBytes } from '../lang/base64OfBytes';
import './ui.css';

interface MmPhotoProps {
  /** The picture as a JPEG; undefined while it is read, drawn as an empty frame. */
  jpeg: Uint8Array | undefined;
  /** What it is, for a reader: "Front photo, October 5, 2026". */
  label: string;
  /** A small one, as in a list of sets; otherwise it fills the width it is given. */
  thumbnail?: boolean;
}

/**
 * A progress photo (MM-157), drawn from the bytes kept on the phone: never
 * a file address, never fetched. Portrait frame, the whole photo shown.
 * It cannot be dragged out, selected, or long-pressed into the phone's
 * "Save to Photos" or "Share" menu: nothing offers the picture to leave the
 * app (the stylesheet's `.mm-photo` and this element's own handlers).
 */
export function MmPhoto({ jpeg, label, thumbnail = false }: MmPhotoProps) {
  const size = thumbnail ? ' mm-photo-thumbnail' : '';
  if (jpeg === undefined) return <div className={`mm-photo mm-photo-empty${size}`} role="img" aria-label={label} />;
  return (
    <img
      className={`mm-photo${size}`}
      src={`data:image/jpeg;base64,${base64OfBytes(jpeg)}`}
      alt={label}
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}
