import type { ProgressPhoto } from '../domain/photos/ProgressPhoto';
import { Fmt } from '../format/Fmt';
import { photoPoseLabel } from '../format/photoPoseLabel';
import { MmPhoto } from '../ui/MmPhoto';
import { usePhotoBytes } from './usePhotoBytes';

interface ComparedPhotoProps {
  photo: ProgressPhoto;
  /** What is said under it, line by line: the day, then the trend weight and the waist when there are any. */
  lines: readonly string[];
}

/** One side of a comparison (MM-157): the photo whole, and its day, trend weight and waist under it. */
export function ComparedPhoto({ photo, lines }: ComparedPhotoProps) {
  const jpeg = usePhotoBytes(photo.id);
  return (
    <figure className="progress-photo-compared">
      <MmPhoto jpeg={jpeg} label={`${photoPoseLabel(photo.pose)} photo, ${Fmt.longDate(photo.date)}`} />
      <figcaption>
        {lines.map((line) => (
          <p key={line} className="app-caption">
            {line}
          </p>
        ))}
      </figcaption>
    </figure>
  );
}
