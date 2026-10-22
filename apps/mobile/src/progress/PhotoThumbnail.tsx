import type { ProgressPhoto } from '../domain/photos/ProgressPhoto';
import { Fmt } from '../format/Fmt';
import { photoPoseLabel } from '../format/photoPoseLabel';
import { MmPhoto } from '../ui/MmPhoto';
import { usePhotoBytes } from './usePhotoBytes';

/** One photo of a set, small, with its pose under it (MM-157). */
export function PhotoThumbnail({ photo }: { photo: ProgressPhoto }) {
  const jpeg = usePhotoBytes(photo.id);
  return (
    <figure className="progress-photo-thumbnail">
      <MmPhoto jpeg={jpeg} label={`${photoPoseLabel(photo.pose)} photo, ${Fmt.longDate(photo.date)}`} thumbnail />
      <figcaption className="app-caption">{photoPoseLabel(photo.pose)}</figcaption>
    </figure>
  );
}
